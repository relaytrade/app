"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fetchFeed } from "@/lib/social/client";
import { profileDisplayName, profilePath } from "@/lib/social/format";
import { FollowButton } from "./FollowButton";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";

export function FeedSection() {
  const { address } = useAccount();
  const supabaseReady = isSupabaseConfigured();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["social-feed", address?.toLowerCase()],
    queryFn: () => fetchFeed(address),
    enabled: supabaseReady,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!supabaseReady) return;

    const client = getSupabaseBrowserClient();
    if (!client) return;

    const channel = client
      .channel("relay-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => {
          void refetch();
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [refetch, supabaseReady]);

  if (!supabaseReady) {
    return (
      <section className="feed-section">
        <header className="feed-section-header">
          <h2 className="feed-section-title">Feed</h2>
          <p className="feed-section-lead">
            Social features need Supabase credentials. Add{" "}
            <span className="mono">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
            <span className="mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</span> to your env,
            run the migration in <span className="mono">supabase/migrations/</span>,
            then restart the dev server.
          </p>
        </header>
      </section>
    );
  }

  const feed = data?.feed ?? [];
  const suggested = data?.suggested ?? [];

  return (
    <section className="feed-section">
      <header className="feed-section-header">
        <h2 className="feed-section-title">Feed</h2>
        <p className="feed-section-lead">
          Follow traders, post theses, and watch the stream update live. Posts are
          signed with your wallet; Relay never posts on your behalf without a signature.
        </p>
      </header>

      <PostComposer />

      {isLoading ? <p className="feed-status">Loading feed…</p> : null}
      {error ? (
        <p className="feed-error">
          {error instanceof Error ? error.message : "Could not load feed."}
        </p>
      ) : null}

      {!isLoading && !error && feed.length === 0 ? (
        <p className="feed-status">
          No posts yet. Follow a trader below or publish the first thesis.
        </p>
      ) : null}

      <div className="feed-list">
        {feed.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {address && suggested.length > 0 ? (
        <div className="feed-suggested">
          <h3 className="feed-suggested-title">Suggested traders</h3>
          <ul className="feed-suggested-list">
            {suggested.map((trader) => (
              <li key={trader.wallet_address} className="feed-suggested-item">
                <div>
                  <Link href={profilePath(trader.wallet_address)} className="feed-author-link">
                    <p className="feed-author">
                      {profileDisplayName(trader)}
                    </p>
                  </Link>
                  {trader.bio ? <p className="feed-suggested-bio">{trader.bio}</p> : null}
                </div>
                <FollowButton
                  target={trader.wallet_address}
                  isFollowing={trader.is_following}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
