import type { Address } from "viem";
import { robinhoodChain, robinhoodChainTestnet } from "./chains";

/**
 * Uniswap v3 deployment addresses keyed by chain ID.
 *
 * Mainnet entries are copied from Uniswap's Robinhood Chain deployment page
 * (developers.uniswap.org/docs/protocols/v3/deployments/v3-robinhood-chain-deployments)
 * and cross-checked on-chain: SwapRouter02.factory() and SwapRouter02.WETH9()
 * resolve to the factory and WETH addresses listed here.
 *
 * Testnet (46630) is intentionally absent. Uniswap publishes no 46630
 * deployment in github.com/Uniswap/contracts/deployments, and the testnet
 * explorer shows many unrelated forks sharing the same contract names.
 * resolveUniswap(46630) throws so callers cannot silently fall back to
 * mainnet addresses while the wallet is on testnet.
 */
export type UniswapDeployment = {
  v3Factory: Address;
  swapRouter02: Address;
  quoterV2: Address;
  universalRouter: Address;
  permit2: Address;
};

const UNISWAP_MAINNET: UniswapDeployment = {
  // developers.uniswap.org/docs/protocols/v3/deployments/v3-robinhood-chain-deployments
  v3Factory: "0x1f7d7550b1b028f7571e69a784071f0205fd2efa",
  swapRouter02: "0xcaf681a66d020601342297493863e78c959e5cb2",
  quoterV2: "0x33e885ed0ec9bf04ecfb19341582aadcb4c8a9e7",
  universalRouter: "0x8876789976decbfcbbbe364623c63652db8c0904",
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
};

const UNISWAP_BY_CHAIN: Partial<Record<number, UniswapDeployment>> = {
  [robinhoodChain.id]: UNISWAP_MAINNET,
};

/** Fee tiers we probe when routing; pools may exist at any of these on mainnet. */
export const UNISWAP_FEE_TIERS = [500, 3000, 10_000] as const;

export type UniswapFeeTier = (typeof UNISWAP_FEE_TIERS)[number];

export function resolveUniswap(chainId: number): UniswapDeployment {
  const deployment = UNISWAP_BY_CHAIN[chainId];
  if (!deployment) {
    throw new Error(
      `No verified Uniswap deployment for chain ${chainId}. ` +
        (chainId === robinhoodChainTestnet.id
          ? "Robinhood testnet has no official Uniswap deployment yet."
          : "Add addresses only after confirming them in Uniswap's deployment docs.")
    );
  }
  return deployment;
}

export function hasUniswap(chainId: number): boolean {
  return chainId in UNISWAP_BY_CHAIN;
}
