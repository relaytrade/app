import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { robinhoodChain, robinhoodChainTestnet } from "./chains";

/** RainbowKit's public demo ID — local dev only when env is unset. */
const RAINBOWKIT_DEMO_PROJECT_ID = "21fef48091f12692cad574a6f7753643";

function getWalletConnectProjectId(): string {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();

  if (projectId) {
    return projectId;
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Using RainbowKit's demo project ID for local development. Create your own at https://cloud.walletconnect.com before shipping."
    );
    return RAINBOWKIT_DEMO_PROJECT_ID;
  }

  throw new Error(
    "Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. WalletConnect requires a project ID from https://cloud.walletconnect.com — add it to .env.local or your deployment environment."
  );
}

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
  projectId: getWalletConnectProjectId(),
  chains: [robinhoodChainTestnet, robinhoodChain],
  ssr: true,
});
