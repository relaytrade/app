import {
  type Address,
  type PublicClient,
  encodeFunctionData,
  zeroAddress,
} from "viem";
import {
  quoterV2Abi,
  swapRouter02Abi,
  uniswapV3FactoryAbi,
  weth9Abi,
} from "./abis";
import {
  type TokenDefinition,
  getWethToken,
  isNativeToken,
} from "./tokens";
import {
  UNISWAP_FEE_TIERS,
  type UniswapDeployment,
  type UniswapFeeTier,
  resolveUniswap,
} from "./uniswap";

/** Default slippage for v1 swaps: 0.5%, enough for L2 without being reckless. */
export const DEFAULT_SLIPPAGE_BPS = 50n;

export type SwapQuote = {
  amountOut: bigint;
  fee: UniswapFeeTier;
};

export type SwapKind = "wrap" | "unwrap" | "uniswap";

export function classifySwap(
  chainId: number,
  tokenIn: TokenDefinition,
  tokenOut: TokenDefinition
): SwapKind {
  const weth = getWethToken(chainId);
  if (!weth) {
    throw new Error(`No WETH registered for chain ${chainId}.`);
  }

  if (isNativeToken(tokenIn) && tokenOut.address === weth.address) {
    return "wrap";
  }
  if (tokenIn.address === weth.address && isNativeToken(tokenOut)) {
    return "unwrap";
  }
  return "uniswap";
}

function applySlippage(amountOut: bigint, slippageBps = DEFAULT_SLIPPAGE_BPS) {
  return (amountOut * (10_000n - slippageBps)) / 10_000n;
}

export async function quoteUniswapExactIn(
  client: PublicClient,
  chainId: number,
  tokenIn: TokenDefinition,
  tokenOut: TokenDefinition,
  amountIn: bigint
): Promise<SwapQuote | null> {
  const deployment = resolveUniswap(chainId);
  const weth = getWethToken(chainId);
  if (!weth) return null;

  const tokenInAddress = isNativeToken(tokenIn) ? weth.address : tokenIn.address;
  const tokenOutAddress = isNativeToken(tokenOut)
    ? weth.address
    : tokenOut.address;

  let best: SwapQuote | null = null;

  for (const fee of UNISWAP_FEE_TIERS) {
    const pool = await client.readContract({
      address: deployment.v3Factory,
      abi: uniswapV3FactoryAbi,
      functionName: "getPool",
      args: [tokenInAddress, tokenOutAddress, fee],
    });
    if (!pool || pool === zeroAddress) continue;

    try {
      const result = await client.readContract({
        address: deployment.quoterV2,
        abi: quoterV2Abi,
        functionName: "quoteExactInputSingle",
        args: [
          {
            tokenIn: tokenInAddress,
            tokenOut: tokenOutAddress,
            amountIn,
            fee,
            sqrtPriceLimitX96: 0n,
          },
        ],
      });
      const amountOut = result[0];
      if (!best || amountOut > best.amountOut) {
        best = { amountOut, fee };
      }
    } catch {
      // Pool exists but may have no usable liquidity for this size; try next tier.
    }
  }

  return best;
}

export function buildUniswapSwapCalls(params: {
  deployment: UniswapDeployment;
  tokenIn: TokenDefinition;
  tokenOut: TokenDefinition;
  amountIn: bigint;
  amountOutMinimum: bigint;
  fee: UniswapFeeTier;
  recipient: Address;
  wethAddress: Address;
}) {
  const {
    deployment,
    tokenIn,
    tokenOut,
    amountIn,
    amountOutMinimum,
    fee,
    recipient,
    wethAddress,
  } = params;

  const tokenInAddress = isNativeToken(tokenIn) ? wethAddress : tokenIn.address;
  const tokenOutAddress = isNativeToken(tokenOut)
    ? wethAddress
    : tokenOut.address;

  const exactInputParams = {
    tokenIn: tokenInAddress,
    tokenOut: tokenOutAddress,
    fee,
    recipient: isNativeToken(tokenOut) ? deployment.swapRouter02 : recipient,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0n,
  };

  if (isNativeToken(tokenOut)) {
    const swapCalldata = encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: "exactInputSingle",
      args: [exactInputParams],
    });
    const unwrapCalldata = encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: "unwrapWETH9",
      args: [exactInputParams.amountOutMinimum, recipient],
    });
    return {
      to: deployment.swapRouter02,
      value: isNativeToken(tokenIn) ? amountIn : 0n,
      data: encodeFunctionData({
        abi: swapRouter02Abi,
        functionName: "multicall",
        args: [[swapCalldata, unwrapCalldata]],
      }),
    } as const;
  }

  return {
    to: deployment.swapRouter02,
    value: isNativeToken(tokenIn) ? amountIn : 0n,
    data: encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: "exactInputSingle",
      args: [
        {
          ...exactInputParams,
          recipient,
        },
      ],
    }),
  } as const;
}

export function buildWrapCall(wethAddress: Address, amountIn: bigint) {
  return {
    to: wethAddress,
    value: amountIn,
    data: encodeFunctionData({
      abi: weth9Abi,
      functionName: "deposit",
    }),
  } as const;
}

export function buildUnwrapCall(wethAddress: Address, amountIn: bigint) {
  return {
    to: wethAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: weth9Abi,
      functionName: "withdraw",
      args: [amountIn],
    }),
  } as const;
}

export function minAmountOut(amountOut: bigint, slippageBps = DEFAULT_SLIPPAGE_BPS) {
  return applySlippage(amountOut, slippageBps);
}

export { resolveUniswap };
