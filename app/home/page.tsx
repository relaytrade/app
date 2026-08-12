import { AppHeader } from "@/components/AppHeader";
import { WalletAuthGate } from "@/components/WalletAuthGate";
import { HomeWelcome } from "@/components/HomeWelcome";
import { SwapWidget } from "@/components/SwapWidget";
import { FeedSection } from "@/components/social/FeedSection";

export default function HomePage() {
  return (
    <WalletAuthGate mode="require-auth">
      <div
        style={{
          minHeight: "100vh",
          background: "var(--ink)",
        }}
      >
        <AppHeader />

        <main
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "48px 24px",
          }}
        >
          <HomeWelcome />

          <SwapWidget />

          <FeedSection />
        </main>
      </div>
    </WalletAuthGate>
  );
}
