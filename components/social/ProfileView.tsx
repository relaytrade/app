"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fetchProfile } from "@/lib/social/client";
import { profileDisplayName, truncateAddress } from "@/lib/social/format";
import { FollowButton } from "./FollowButton";
import { PostCard } from "./PostCard";
import { ProfileEditor } from "./ProfileEditor";

type ProfileViewProps = {
  address: string;
};

export function ProfileView({ address }: ProfileViewProps) {
  const { address: viewerAddress } = useAccount();
  const supabaseReady = isSupabaseConfigured();
  const [editing, setEditing] = useState(false);

  const normalizedAddress = address.toLowerCase();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["social-profile", normalizedAddress, viewerAddress?.toLowerCase()],
    queryFn: () => fetchProfile(normalizedAddress, viewerAddress),
    enabled: supabaseReady && Boolean(normalizedAddress),
    staleTime: 30_000,
  });

  const profile = data?.profile;
  const posts = data?.posts ?? [];
  const displayName = profile ? profileDisplayName(profile) : truncateAddress(normalizedAddress);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ink)",
      }}
    >
      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <Link href="/home" className="profile-back-link">
          ← Back to home
        </Link>

        {!supabaseReady ? (
          <section className="profile-section">
            <h1 className="profile-title">Profile</h1>
            <p className="feed-section-lead">
              Supabase is not configured. Add your project credentials to load profiles.
            </p>
          </section>
        ) : null}

        {supabaseReady && isLoading ? <p className="feed-status">Loading profile…</p> : null}
        {supabaseReady && error ? (
          <p className="feed-error">
            {error instanceof Error ? error.message : "Could not load profile."}
          </p>
        ) : null}

        {supabaseReady && profile ? (
          <section className="profile-section">
            <div className="profile-header">
              <div className="profile-header-main">
                <div className="profile-avatar" aria-hidden>
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h1 className="profile-title">{displayName}</h1>
                  <p className="profile-wallet mono">{truncateAddress(profile.wallet_address)}</p>
                </div>
              </div>

              <div className="profile-actions">
                {profile.is_owner ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditing((value) => !value)}
                  >
                    {editing ? "Close editor" : "Edit profile"}
                  </button>
                ) : viewerAddress ? (
                  <FollowButton
                    target={profile.wallet_address}
                    isFollowing={profile.is_following}
                  />
                ) : null}
              </div>
            </div>

            {!editing && profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
            {!editing && !profile.bio && profile.is_owner ? (
              <p className="profile-bio profile-bio-empty">
                Add a bio so followers know your trading style.
              </p>
            ) : null}

            {editing ? (
              <ProfileEditor
                profile={profile}
                onCancel={() => setEditing(false)}
                onSaved={() => {
                  setEditing(false);
                  void refetch();
                }}
              />
            ) : null}

            <dl className="profile-stats">
              <div>
                <dt>Posts</dt>
                <dd className="mono">{profile.post_count}</dd>
              </div>
              <div>
                <dt>Followers</dt>
                <dd className="mono">{profile.follower_count}</dd>
              </div>
              <div>
                <dt>Following</dt>
                <dd className="mono">{profile.following_count}</dd>
              </div>
            </dl>

            <div className="profile-posts">
              <h2 className="profile-posts-title">Posts</h2>
              {posts.length === 0 ? (
                <p className="feed-status">
                  {profile.is_owner
                    ? "You have not posted yet. Share a thesis from the home feed."
                    : "This trader has not posted yet."}
                </p>
              ) : (
                <div className="feed-list">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
