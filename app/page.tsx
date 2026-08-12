/**
 * Temporary landing screen.
 *
 * This exists to prove the design tokens ported correctly and to give
 * the project a deployable first commit. It is not the real onboarding
 * flow: that will replace this file once the rest of the app is built
 * out. Wallet connect below is real and working, everything around it
 * is still scaffolding.
 *
 * Inline styles are used here on purpose and only here. This screen is
 * throwaway scaffolding, not a component that other parts of the app
 * will import or extend, so a dedicated stylesheet or component file
 * would add structure without adding value. Once real screens are built
 * they should follow whatever component and styling convention the team
 * settles on, not copy this pattern.
 */
import { ConnectWallet } from "@/components/ConnectWallet";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "28px",
        padding: "24px",
        textAlign: "center",
        background:
          "radial-gradient(120% 100% at 50% 0%, rgba(124,92,252,0.16), transparent 55%), var(--ink)",
      }}
    >
      <div className="brand-lockup">
        <div className="signal-mark">
          <div className="ring r1" />
          <div className="ring r2" />
          <div className="dot" />
        </div>
        <span>Relay</span>
      </div>

      <div style={{ maxWidth: 480 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "34px",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            marginBottom: "14px",
          }}
        >
          Trade in sync with the market&apos;s{" "}
          <em style={{ color: "var(--violet)", fontStyle: "normal" }}>
            sharpest
          </em>{" "}
          traders.
        </h1>
        <p
          style={{
            color: "var(--text-2)",
            fontSize: "15px",
            lineHeight: 1.6,
          }}
        >
          Connect a wallet to get started. Robinhood Chain testnet for now.
        </p>
      </div>

      <ConnectWallet />
    </main>
  );
}
