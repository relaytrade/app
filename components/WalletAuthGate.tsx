"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

type WalletAuthGateProps = {
  /**
   * require-guest: landing page — send connected users to /home
   * require-auth: app shell — send disconnected users back to /
   */
  mode: "require-guest" | "require-auth";
  children?: React.ReactNode;
};

export function WalletAuthGate({ mode, children }: WalletAuthGateProps) {
  const router = useRouter();
  const { isConnected, status } = useAccount();

  const pending = status === "connecting" || status === "reconnecting";

  useEffect(() => {
    if (pending) return;

    if (mode === "require-guest" && isConnected) {
      router.replace("/home");
    }

    if (mode === "require-auth" && !isConnected) {
      router.replace("/");
    }
  }, [isConnected, mode, pending, router]);

  if (mode === "require-auth" && (pending || !isConnected)) {
    return null;
  }

  return children ?? null;
}
