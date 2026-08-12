import { defineChain } from "viem";

/**
 * Robinhood Chain testnet.
 *
 * Robinhood Chain isn't in viem's built-in chain list, so it needs to be
 * defined manually. Chain ID, RPC URL, and explorer URL below are taken
 * directly from Robinhood's chain documentation (docs.robinhood.com/chain),
 * not inferred from an Arbitrum Orbit naming convention. An earlier
 * version of this file used guessed URLs that did not resolve, which is
 * worth knowing if you're diffing chain history: those were wrong, not
 * placeholders that needed filling in.
 *
 * The RPC URL still reads from an environment variable first, falling
 * back to Robinhood's public endpoint. The public endpoint is real and
 * working, but it's rate-limited and explicitly not recommended for
 * production traffic. Set NEXT_PUBLIC_RPC_URL to a dedicated provider
 * (Alchemy has first-class Robinhood Chain support) before this app
 * carries real usage.
 */
export const robinhoodChainTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://rpc.testnet.chain.robinhood.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
  testnet: true,
});

/**
 * Robinhood Chain mainnet.
 *
 * Defined now, even though the app targets testnet until real funds are
 * involved, so the switch to mainnet later is a one-line config change
 * in wagmi.ts rather than a new chain definition written under time
 * pressure.
 */
export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL ||
          "https://rpc.mainnet.chain.robinhood.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
  testnet: false,
});
