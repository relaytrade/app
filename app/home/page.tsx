import { ConnectWallet } from "@/components/ConnectWallet";
import { WalletAuthGate } from "@/components/WalletAuthGate";
import { HomeWelcome } from "@/components/HomeWelcome";
import { SwapWidget } from "@/components/SwapWidget";

export default function HomePage() {
  return (
    <WalletAuthGate mode="require-auth">
      <div
        style={{
          minHeight: "100vh",
          background: "var(--ink)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-soft)",
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
          <ConnectWallet />
        </header>

        <main
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "48px 24px",
          }}
        >
          <HomeWelcome />

          <SwapWidget />

          <section
            style={{
              marginTop: 40,
              padding: "28px 24px",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              border: "1px solid var(--border-soft)",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Feed
            </h2>
            <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6 }}>
              The social feed and copy trading flow are still being built. Your
              wallet is connected — this is the home screen they will live on.
            </p>
          </section>
        </main>
      </div>
    </WalletAuthGate>
  );
}
