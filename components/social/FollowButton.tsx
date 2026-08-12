"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { followTrader } from "@/lib/social/client";
import { useSignedSocialAction } from "./useSignedSocialAction";

type FollowButtonProps = {
  target: string;
  isFollowing: boolean;
};

export function FollowButton({ target, isFollowing }: FollowButtonProps) {
  const queryClient = useQueryClient();
  const { signAction, isSigning, address } = useSignedSocialAction();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = pending || isSigning;

  async function handleClick() {
    if (!address || busy) return;

    setPending(true);
    setError(null);

    try {
      const action = isFollowing ? "unfollow" : "follow";
      const signed = await signAction({ action, target });
      await followTrader({ ...signed, action, target });
      await queryClient.invalidateQueries({ queryKey: ["social-feed"] });
      await queryClient.invalidateQueries({ queryKey: ["social-profile"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update follow.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="follow-button-wrap">
      <button
        type="button"
        className={`btn btn-sm ${isFollowing ? "btn-ghost" : "btn-primary"}`}
        onClick={handleClick}
        disabled={!address || busy}
      >
        {busy ? "Signing…" : isFollowing ? "Following" : "Follow"}
      </button>
      {error ? <p className="feed-error">{error}</p> : null}
    </div>
  );
}
