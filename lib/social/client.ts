import type { SocialAction } from "./messages";

export type SignedSocialPayload = {
  wallet: string;
  signature: `0x${string}`;
  timestamp: number;
  action?: SocialAction;
  body?: string;
  target?: string;
  displayName?: string;
  bio?: string;
};

export async function createPost(payload: SignedSocialPayload & { body: string }) {
  const response = await fetch("/api/social/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to publish post.");
  }

  return data;
}

export async function followTrader(
  payload: SignedSocialPayload & { action: "follow" | "unfollow"; target: string }
) {
  const response = await fetch("/api/social/follow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update follow status.");
  }

  return data;
}

export async function updateProfile(
  payload: SignedSocialPayload & { displayName: string; bio: string }
) {
  const response = await fetch("/api/social/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update profile.");
  }

  return data;
}

export async function fetchProfile(address: string, viewer?: string) {
  const params = new URLSearchParams({ address });
  if (viewer) {
    params.set("viewer", viewer);
  }

  const response = await fetch(`/api/social/profile?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load profile.");
  }

  return data as {
    profile: import("@/lib/supabase/database.types").ProfileDetail;
    posts: import("@/lib/supabase/database.types").ProfilePost[];
  };
}

export async function fetchFeed(wallet?: string) {
  const query = wallet ? `?wallet=${encodeURIComponent(wallet)}` : "";
  const response = await fetch(`/api/social/feed${query}`);

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to load feed.");
  }

  return data as {
    feed: import("@/lib/supabase/database.types").FeedPost[];
    suggested: import("@/lib/supabase/database.types").SuggestedTrader[];
  };
}

export function formatRelativeTime(isoDate: string) {
  const deltaMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(deltaMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
