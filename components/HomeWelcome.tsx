"use client";

import { useAccount } from "wagmi";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function HomeWelcome() {
  const { address } = useAccount();

  return (
    <div>
      <p
        style={{
          color: "var(--text-2)",
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 8,
        }}
      >
        Welcome back
      </p>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 32,
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
        }}
      >
        {address ? (
          <>
            <span className="mono">{truncateAddress(address)}</span>
          </>
        ) : (
          "Connected"
        )}
      </h1>
      <p
        style={{
          color: "var(--text-2)",
          fontSize: 15,
          lineHeight: 1.6,
          marginTop: 12,
        }}
      >
        Robinhood Chain mainnet. Swap ETH, WETH, and USDG through the verified
        Uniswap v3 router when pools have liquidity.
      </p>
    </div>
  );
}
