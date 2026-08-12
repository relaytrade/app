"use client";

import Link from "next/link";
import type { FeedPost } from "@/lib/supabase/database.types";
import { formatRelativeTime } from "@/lib/social/client";
import { profileDisplayName, profilePath } from "@/lib/social/format";

type PostCardProps = {
  post: FeedPost;
};

export function PostCard({ post }: PostCardProps) {
  const displayName = profileDisplayName(post.author);

  return (
    <article className="feed-card">
      <header className="feed-card-header">
        <Link href={profilePath(post.author.wallet_address)} className="feed-avatar-link">
          <div className="feed-avatar" aria-hidden>
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        </Link>
        <div>
          <Link href={profilePath(post.author.wallet_address)} className="feed-author-link">
            <p className="feed-author">{displayName}</p>
          </Link>
          <p className="feed-meta mono">{formatRelativeTime(post.created_at)}</p>
        </div>
      </header>
      <p className="feed-body">{post.body}</p>
    </article>
  );
}
