"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ProfileDetail } from "@/lib/supabase/database.types";
import { updateProfile } from "@/lib/social/client";
import { useSignedSocialAction } from "./useSignedSocialAction";

const DISPLAY_NAME_MAX = 32;
const BIO_MAX = 280;

type ProfileEditorProps = {
  profile: ProfileDetail;
  onCancel: () => void;
  onSaved: () => void;
};

export function ProfileEditor({ profile, onCancel, onSaved }: ProfileEditorProps) {
  const queryClient = useQueryClient();
  const { signAction, isSigning } = useSignedSocialAction();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = pending || isSigning;
  const trimmedName = displayName.trim();
  const trimmedBio = bio.trim();
  const canSave =
    Boolean(trimmedName) &&
    trimmedName.length <= DISPLAY_NAME_MAX &&
    trimmedBio.length <= BIO_MAX &&
    !busy;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) return;

    setPending(true);
    setError(null);

    try {
      const signed = await signAction({
        action: "update_profile",
        displayName: trimmedName,
        bio: trimmedBio,
      });
      await updateProfile({
        ...signed,
        displayName: trimmedName,
        bio: trimmedBio,
      });
      await queryClient.invalidateQueries({ queryKey: ["social-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["social-feed"] });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="profile-editor" onSubmit={handleSubmit}>
      <div className="profile-field">
        <label htmlFor="profile-display-name">Display name</label>
        <input
          id="profile-display-name"
          className="profile-input"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={DISPLAY_NAME_MAX}
          disabled={busy}
        />
        <span className="feed-meta mono">
          {trimmedName.length}/{DISPLAY_NAME_MAX}
        </span>
      </div>

      <div className="profile-field">
        <label htmlFor="profile-bio">Bio</label>
        <textarea
          id="profile-bio"
          className="profile-textarea"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={BIO_MAX}
          rows={4}
          placeholder="What do you trade and why?"
          disabled={busy}
        />
        <span className="feed-meta mono">
          {trimmedBio.length}/{BIO_MAX}
        </span>
      </div>

      <div className="profile-editor-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!canSave}>
          {busy ? "Signing…" : "Save profile"}
        </button>
      </div>

      {error ? <p className="feed-error">{error}</p> : null}
    </form>
  );
}
