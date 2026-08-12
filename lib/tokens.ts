import type { Address } from "viem";
import { robinhoodChain, robinhoodChainTestnet } from "./chains";

/**
 * Token metadata keyed by chain ID.
 *
 * Mainnet WETH and USDG addresses come from Robinhood's token contract page
 * (docs.robinhood.com/chain/contracts/). ETH is native gas on Robinhood Chain
 * and is represented with the zero address sentinel so swap code can branch
 * between wrap/unwrap and Uniswap without overloading WETH's contract address.
 *
 * Testnet lists WETH only for wrap/unwrap experiments. Without a verified
 * Uniswap deployment on 46630, no ERC20 trading pairs are registered here.
 */
export type TokenDefinition = {
  symbol: string;
  name: string;
  decimals: number;
  /** Zero address means native ETH on this chain. */
  address: Address;
  isNative?: boolean;
};

export const NATIVE_ETH_ADDRESS =
  "0x0000000000000000000000000000000000000000" as Address;

const MAINNET_TOKENS: TokenDefinition[] = [
  {
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    address: NATIVE_ETH_ADDRESS,
    isNative: true,
  },
  {
    // docs.robinhood.com/chain/contracts/
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    address: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
  },
  {
    // docs.robinhood.com/chain/contracts/
    symbol: "USDG",
    name: "USDG",
    decimals: 18,
    address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  },
];

const TESTNET_TOKENS: TokenDefinition[] = [
  {
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    address: NATIVE_ETH_ADDRESS,
    isNative: true,
  },
];

const TOKENS_BY_CHAIN: Partial<Record<number, TokenDefinition[]>> = {
  [robinhoodChain.id]: MAINNET_TOKENS,
  [robinhoodChainTestnet.id]: TESTNET_TOKENS,
};

export function getTokensForChain(chainId: number): TokenDefinition[] {
  return TOKENS_BY_CHAIN[chainId] ?? [];
}

export function getTokenBySymbol(
  chainId: number,
  symbol: string
): TokenDefinition | undefined {
  return getTokensForChain(chainId).find(
    (token) => token.symbol.toUpperCase() === symbol.toUpperCase()
  );
}

export function isNativeToken(token: TokenDefinition): boolean {
  return token.isNative === true || token.address === NATIVE_ETH_ADDRESS;
}

export function isEthWethPair(
  tokenIn: TokenDefinition,
  tokenOut: TokenDefinition
): boolean {
  const symbols = new Set([tokenIn.symbol, tokenOut.symbol]);
  return symbols.has("ETH") && symbols.has("WETH");
}

export function getWethToken(chainId: number): TokenDefinition | undefined {
  return getTokenBySymbol(chainId, "WETH");
}
