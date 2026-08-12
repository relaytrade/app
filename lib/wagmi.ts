import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { robinhoodChain, robinhoodChainTestnet } from "./chains";

/**
 * Wagmi config, built through RainbowKit's getDefaultConfig helper.
 *
 * That helper does three things worth knowing about: it wires up the
 * standard set of connectors (injected wallets like MetaMask, plus
 * WalletConnect for everything else) without us having to configure
 * each one by hand, it requires a WalletConnect project ID because
 * WalletConnect is a hosted relay service and needs one to route
 * connection requests, and it accepts the list of chains the app
 * supports, which is just the two Robinhood Chain networks for now.
 *
 * Both networks are listed so a user can be on either without the app
 * breaking, but see providers.tsx for where we default new connections
 * to testnet.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "Relay",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  chains: [robinhoodChainTestnet, robinhoodChain],
  ssr: true,
});
