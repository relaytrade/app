"use client";

import { useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { buildSocialMessage, type SocialAction } from "@/lib/social/messages";

export function useSignedSocialAction() {
  const { address } = useAccount();
  const { signMessageAsync, isPending } = useSignMessage();

  const signAction = useCallback(
    async (params: {
      action: SocialAction;
      body?: string;
      target?: string;
      displayName?: string;
      bio?: string;
    }) => {
      if (!address) {
        throw new Error("Connect your wallet to continue.");
      }

      const timestamp = Date.now();
      const message = buildSocialMessage({
        action: params.action,
        wallet: address,
        timestamp,
        body: params.body,
        target: params.target,
        displayName: params.displayName,
        bio: params.bio,
      });

      const signature = await signMessageAsync({ message });

      return {
        wallet: address,
        signature,
        timestamp,
        body: params.body,
        target: params.target,
        displayName: params.displayName,
        bio: params.bio,
        action: params.action,
      };
    },
    [address, signMessageAsync]
  );

  return { signAction, isSigning: isPending, address };
}
