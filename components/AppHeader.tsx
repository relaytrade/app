import Link from "next/link";
import { ConnectWallet } from "@/components/ConnectWallet";

export function AppHeader() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Link href="/home" className="brand-lockup">
          <div className="signal-mark">
            <div className="ring r1" />
            <div className="ring r2" />
            <div className="dot" />
          </div>
          <span>Relay</span>
        </Link>
        <nav className="app-nav">
          <Link href="/home">Home</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      </div>
      <ConnectWallet />
    </header>
  );
}
