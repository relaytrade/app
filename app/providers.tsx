"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { robinhoodChainTestnet } from "@/lib/chains";
import { wagmiConfig } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

/**
 * This file is marked "use client" and kept separate from layout.tsx on
 * purpose. Wagmi and RainbowKit both touch browser-only APIs (window,
 * localStorage) during initialization, so anything using them has to run
 * on the client. Next.js server components cannot do that. Isolating the
 * provider tree here keeps layout.tsx itself as a server component,
 * which is the default and preferred mode, rather than forcing the
 * entire app into client rendering just to satisfy these two libraries.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  /**
   * The QueryClient is created inside useState's lazy initializer, not
   * as `new QueryClient()` directly in the component body. A component
   * function reruns on every render, so writing it inline would rebuild
   * the client, and with it the entire query cache, on every single
   * render. useState's initializer only runs once, on mount, which is
   * what we actually want: one stable client for the lifetime of the
   * provider tree.
   */
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={robinhoodChainTestnet}
          theme={darkTheme({
            accentColor: "#7c5cfc",
            accentColorForeground: "#ffffff",
            borderRadius: "large",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
