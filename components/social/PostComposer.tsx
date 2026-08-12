"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createPost } from "@/lib/social/client";
import { useSignedSocialAction } from "./useSignedSocialAction";

const MAX_LENGTH = 2000;

export function PostComposer() {
  const queryClient = useQueryClient();
  const { signAction, isSigning, address } = useSignedSocialAction();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = pending || isSigning;
  const trimmed = body.trim();
  const canSubmit = Boolean(address && trimmed && trimmed.length <= MAX_LENGTH && !busy);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setPending(true);
    setError(null);

    try {
      const signed = await signAction({ action: "post", body: trimmed });
      await createPost({ ...signed, body: trimmed });
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish post.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="feed-composer" onSubmit={handleSubmit}>
      <label htmlFor="post-body" className="feed-composer-label">
        Share a trade thesis
      </label>
      <textarea
        id="post-body"
        className="feed-composer-input"
        placeholder="What are you watching on Robinhood Chain?"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={MAX_LENGTH}
        rows={4}
        disabled={!address || busy}
      />
      <div className="feed-composer-footer">
        <span className="feed-meta mono">
          {trimmed.length}/{MAX_LENGTH}
        </span>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!canSubmit}>
          {busy ? "Signing…" : "Post"}
        </button>
      </div>
      {error ? <p className="feed-error">{error}</p> : null}
    </form>
  );
}
