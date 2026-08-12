"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatUnits, parseUnits, type Hex } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { erc20Abi, weth9Abi } from "@/lib/abis";
import { robinhoodChain } from "@/lib/chains";
import {
  buildUniswapSwapCalls,
  classifySwap,
  minAmountOut,
  quoteUniswapExactIn,
  resolveUniswap,
} from "@/lib/swap";
import {
  getTokenBySymbol,
  getTokensForChain,
  getWethToken,
  isEthWethPair,
  isNativeToken,
  type TokenDefinition,
} from "@/lib/tokens";
import { hasUniswap } from "@/lib/uniswap";

function formatAmount(value: bigint, decimals: number, maxFraction = 6) {
  const formatted = formatUnits(value, decimals);
  const [whole, fraction = ""] = formatted.split(".");
  if (!fraction || maxFraction === 0) return whole;
  return `${whole}.${fraction.slice(0, maxFraction)}`.replace(/\.$/, "");
}

function resetSwapForm(setAmountIn: (value: string) => void) {
  setAmountIn("");
}

export function SwapWidget() {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId });

  const [tokenInSymbol, setTokenInSymbol] = useState("ETH");
  const [tokenOutSymbol, setTokenOutSymbol] = useState("USDG");
  const [amountIn, setAmountIn] = useState("");

  const tokens = getTokensForChain(chainId);
  const swapAvailable = hasUniswap(chainId);

  const tokenIn = getTokenBySymbol(chainId, tokenInSymbol);
  const tokenOut = getTokenBySymbol(chainId, tokenOutSymbol);
  const weth = getWethToken(chainId);

  const parsedAmountIn = useMemo(() => {
    if (!tokenIn || !amountIn) return null;
    try {
      const value = parseUnits(amountIn, tokenIn.decimals);
      return value > 0n ? value : null;
    } catch {
      return null;
    }
  }, [amountIn, tokenIn]);

  const swapKind = useMemo(() => {
    if (!tokenIn || !tokenOut) return null;
    if (isEthWethPair(tokenIn, tokenOut)) {
      return classifySwap(chainId, tokenIn, tokenOut);
    }
    return swapAvailable ? "uniswap" : null;
  }, [chainId, swapAvailable, tokenIn, tokenOut]);

  const spender = swapAvailable ? resolveUniswap(chainId).swapRouter02 : undefined;

  const {
    data: quote,
    error: quoteQueryError,
    isFetching: isQuoting,
  } = useQuery({
    queryKey: [
      "swap-quote",
      chainId,
      tokenInSymbol,
      tokenOutSymbol,
      parsedAmountIn?.toString(),
    ],
    enabled: Boolean(
      publicClient &&
        tokenIn &&
        tokenOut &&
        parsedAmountIn &&
        tokenIn.symbol !== tokenOut.symbol
    ),
    queryFn: async () => {
      if (!publicClient || !tokenIn || !tokenOut || !parsedAmountIn) {
        throw new Error("Missing swap inputs.");
      }

      if (isEthWethPair(tokenIn, tokenOut)) {
        return { amountOut: parsedAmountIn, fee: 3000 as const };
      }

      if (!swapAvailable) {
        throw new Error("Uniswap is only available on Robinhood Chain mainnet.");
      }

      const result = await quoteUniswapExactIn(
        publicClient,
        chainId,
        tokenIn,
        tokenOut,
        parsedAmountIn
      );

      if (!result) {
        throw new Error("No Uniswap pool with liquidity for this pair.");
      }

      return result;
    },
  });

  const quoteError =
    tokenIn && tokenOut && tokenIn.symbol === tokenOut.symbol
      ? "Choose two different tokens."
      : quoteQueryError instanceof Error
        ? quoteQueryError.message
        : null;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address:
      tokenIn && !isNativeToken(tokenIn) && spender
        ? tokenIn.address
        : undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && spender ? [address, spender] : undefined,
    query: {
      enabled: Boolean(
        address &&
          spender &&
          tokenIn &&
          !isNativeToken(tokenIn) &&
          swapKind === "uniswap"
      ),
    },
  });

  const onSwapSettled = useCallback(() => {
    resetSwapForm(setAmountIn);
    void refetchAllowance();
  }, [refetchAllowance]);

  const { writeContract, data: writeHash, isPending: isWritePending, error: writeError, reset: resetWrite } =
    useWriteContract({
      mutation: {
        onSuccess: onSwapSettled,
      },
    });
  const { sendTransaction, data: sendHash, isPending: isSendPending, error: sendError, reset: resetSend } =
    useSendTransaction({
      mutation: {
        onSuccess: onSwapSettled,
      },
    });

  const txHash = writeHash ?? sendHash;
  const isPending = isWritePending || isSendPending;
  const error = writeError ?? sendError;

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const needsApproval =
    swapKind === "uniswap" &&
    tokenIn &&
    !isNativeToken(tokenIn) &&
    parsedAmountIn &&
    allowance !== undefined &&
    allowance < parsedAmountIn;

  const flipTokens = () => {
    setTokenInSymbol(tokenOutSymbol);
    setTokenOutSymbol(tokenInSymbol);
  };

  const submitSwap = useCallback(() => {
    if (!address || !tokenIn || !tokenOut || !parsedAmountIn || !quote || !weth) {
      return;
    }

    resetWrite();
    resetSend();

    if (swapKind === "wrap") {
      writeContract({
        address: weth.address,
        abi: weth9Abi,
        functionName: "deposit",
        value: parsedAmountIn,
      });
      return;
    }

    if (swapKind === "unwrap") {
      writeContract({
        address: weth.address,
        abi: weth9Abi,
        functionName: "withdraw",
        args: [parsedAmountIn],
      });
      return;
    }

    if (swapKind === "uniswap") {
      const deployment = resolveUniswap(chainId);

      if (needsApproval && !isNativeToken(tokenIn)) {
        writeContract({
          address: tokenIn.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [deployment.swapRouter02, parsedAmountIn],
        });
        return;
      }

      const call = buildUniswapSwapCalls({
        deployment,
        tokenIn,
        tokenOut,
        amountIn: parsedAmountIn,
        amountOutMinimum: minAmountOut(quote.amountOut),
        fee: quote.fee,
        recipient: address,
        wethAddress: weth.address,
      });

      sendTransaction({
        to: call.to,
        data: call.data as Hex,
        value: call.value,
      });
    }
  }, [
    address,
    chainId,
    needsApproval,
    parsedAmountIn,
    quote,
    resetSend,
    resetWrite,
    sendTransaction,
    swapKind,
    tokenIn,
    tokenOut,
    weth,
    writeContract,
  ]);

  if (chainId !== robinhoodChain.id) {
    return (
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Swap</h2>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6 }}>
          Uniswap swaps are wired for Robinhood Chain mainnet (chain 4663).
          Switch your wallet to mainnet to trade through the verified router.
        </p>
      </section>
    );
  }

  if (tokens.length === 0) {
    return null;
  }

  const outTokens = tokens.filter((token) => token.symbol !== tokenInSymbol);

  const buttonLabel = (() => {
    if (!address) return "Connect wallet to swap";
    if (isPending || isConfirming) return "Confirm in wallet…";
    if (needsApproval) return `Approve ${tokenIn?.symbol ?? "token"}`;
    if (tokenIn && tokenOut && isEthWethPair(tokenIn, tokenOut)) {
      return tokenIn.symbol === "ETH" ? "Wrap ETH" : "Unwrap WETH";
    }
    return "Swap";
  })();

  const disabled =
    !address ||
    !parsedAmountIn ||
    !quote ||
    Boolean(quoteError) ||
    isPending ||
    isConfirming ||
    !tokenIn ||
    !tokenOut;

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>Swap</h2>

      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "var(--text-2)", fontSize: 13 }}>You pay</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={amountIn}
              onChange={(event) => setAmountIn(event.target.value)}
              style={inputStyle}
            />
            <TokenSelect
              tokens={tokens}
              value={tokenInSymbol}
              onChange={setTokenInSymbol}
            />
          </div>
        </label>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={flipTokens}
            aria-label="Flip tokens"
          >
            ↕
          </button>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "var(--text-2)", fontSize: 13 }}>You receive</span>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ ...inputStyle, color: "var(--text-1)" }}>
              {isQuoting
                ? "Quoting…"
                : quote && tokenOut
                  ? formatAmount(quote.amountOut, tokenOut.decimals)
                  : "0.0"}
            </div>
            <TokenSelect
              tokens={outTokens.length > 0 ? outTokens : tokens}
              value={tokenOutSymbol}
              onChange={setTokenOutSymbol}
            />
          </div>
        </label>

        {quote && tokenOut && swapKind === "uniswap" && (
          <p style={{ color: "var(--text-3)", fontSize: 13 }}>
            Route: Uniswap v3 pool, fee tier {(quote.fee / 10_000).toFixed(2)}%
          </p>
        )}

        {quoteError && (
          <p style={{ color: "var(--rose)", fontSize: 13 }}>{quoteError}</p>
        )}

        {error && (
          <p style={{ color: "var(--rose)", fontSize: 13 }}>
            {error.message.split("\n")[0]}
          </p>
        )}

        {isSuccess && (
          <p style={{ color: "var(--mint)", fontSize: 13 }}>
            Transaction submitted successfully.
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={disabled}
          onClick={submitSwap}
        >
          {buttonLabel}
        </button>
      </div>
    </section>
  );
}

function TokenSelect({
  tokens,
  value,
  onChange,
}: {
  tokens: TokenDefinition[];
  value: string;
  onChange: (symbol: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        ...inputStyle,
        minWidth: 108,
        cursor: "pointer",
      }}
    >
      {tokens.map((token) => (
        <option key={token.symbol} value={token.symbol}>
          {token.symbol}
        </option>
      ))}
    </select>
  );
}

const sectionStyle: CSSProperties = {
  marginTop: 40,
  padding: "28px 24px",
  borderRadius: "var(--radius-lg)",
  background: "var(--surface)",
  border: "1px solid var(--border-soft)",
};

const headingStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 16,
};

const inputStyle: CSSProperties = {
  flex: 1,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-1)",
  fontSize: 15,
  padding: "12px 14px",
  outline: "none",
};
