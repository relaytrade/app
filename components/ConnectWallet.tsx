"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * RainbowKit ships a default connect button, but it renders with its own
 * styling and doesn't accept our design tokens directly. Rather than
 * fighting its CSS with overrides, we use ConnectButton.Custom, which
 * hands back the raw connection state and lets us render our own markup
 * with the .btn classes already defined in globals.css. This keeps the
 * wallet connect button visually identical to every other button in the
 * product instead of looking like a bolted-on library widget.
 *
 * The three states handled below are the three states that actually
 * matter to a user: not connected yet, connected but on a chain the app
 * doesn't support, and connected and ready to go. RainbowKit exposes a
 * few more granular states (chain unsupported vs unavailable, etc.) but
 * collapsing them to these three keeps the UI honest without exposing
 * implementation detail the user doesn't need.
 */
export function ConnectWallet() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="btn btn-primary"
                    type="button"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="btn btn-danger"
                    type="button"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  className="btn btn-ghost"
                  type="button"
                >
                  {account.displayName}
                  {account.displayBalance ? ` (${account.displayBalance})` : ""}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
