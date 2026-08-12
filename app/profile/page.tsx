"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { WalletAuthGate } from "@/components/WalletAuthGate";

export default function OwnProfileRedirectPage() {
  const router = useRouter();
  const { address } = useAccount();

  useEffect(() => {
    if (address) {
      router.replace(`/profile/${address.toLowerCase()}`);
    }
  }, [address, router]);

  return (
    <WalletAuthGate mode="require-auth">
      <div
        style={{
          minHeight: "100vh",
          background: "var(--ink)",
          display: "grid",
          placeItems: "center",
          color: "var(--text-2)",
        }}
      >
        Opening your profile…
      </div>
    </WalletAuthGate>
  );
}
