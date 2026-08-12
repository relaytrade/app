import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseServerConfigured } from "@/lib/supabase/config";
import { verifySocialRequest } from "@/lib/social/verify";
import { profileDisplayName, truncateAddress } from "@/lib/social/format";
import type { ProfileDetail, ProfilePost } from "@/lib/supabase/database.types";

const DISPLAY_NAME_MAX = 32;
const BIO_MAX = 280;

export async function GET(request: Request) {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const addressParam = searchParams.get("address");
  const viewerParam = searchParams.get("viewer");

  if (!addressParam || !isAddress(addressParam)) {
    return NextResponse.json({ error: "Invalid profile address." }, { status: 400 });
  }

  const profileAddress = getAddress(addressParam).toLowerCase();
  let viewer: string | null = null;

  if (viewerParam) {
    if (!isAddress(viewerParam)) {
      return NextResponse.json({ error: "Invalid viewer address." }, { status: 400 });
    }
    viewer = getAddress(viewerParam).toLowerCase();
  }

  const supabase = getSupabaseServiceClient();

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("wallet_address, display_name, bio, created_at")
    .eq("wallet_address", profileAddress)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profileRow) {
    profileRow = {
      wallet_address: profileAddress,
      display_name: truncateAddress(profileAddress),
      bio: null,
      created_at: new Date().toISOString(),
    };
  }

  const [
    { count: followerCount, error: followerError },
    { count: followingCount, error: followingError },
    { count: postCount, error: postCountError },
    { data: posts, error: postsError },
  ] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_address", profileAddress),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_address", profileAddress),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_address", profileAddress),
    supabase
      .from("posts")
      .select("id, author_address, body, created_at")
      .eq("author_address", profileAddress)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (followerError || followingError || postCountError || postsError) {
    const message =
      followerError?.message ??
      followingError?.message ??
      postCountError?.message ??
      postsError?.message ??
      "Failed to load profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let isFollowing = false;

  if (viewer && viewer !== profileAddress) {
    const { data: followRow, error: followError } = await supabase
      .from("follows")
      .select("follower_address")
      .eq("follower_address", viewer)
      .eq("following_address", profileAddress)
      .maybeSingle();

    if (followError) {
      return NextResponse.json({ error: followError.message }, { status: 500 });
    }

    isFollowing = Boolean(followRow);
  }

  const profile: ProfileDetail = {
    ...profileRow,
    follower_count: followerCount ?? 0,
    following_count: followingCount ?? 0,
    post_count: postCount ?? 0,
    is_following: isFollowing,
    is_owner: viewer === profileAddress,
  };

  const author = {
    wallet_address: profile.wallet_address,
    display_name: profileDisplayName(profile),
  };

  const profilePosts: ProfilePost[] =
    posts?.map((post) => ({
      ...post,
      author,
    })) ?? [];

  return NextResponse.json({ profile, posts: profilePosts });
}

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 }
    );
  }

  const payload = await request.json();
  const displayName =
    typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  const bio = typeof payload.bio === "string" ? payload.bio.trim() : "";

  if (!displayName || displayName.length > DISPLAY_NAME_MAX) {
    return NextResponse.json(
      { error: `Display name must be between 1 and ${DISPLAY_NAME_MAX} characters.` },
      { status: 400 }
    );
  }

  if (bio.length > BIO_MAX) {
    return NextResponse.json(
      { error: `Bio must be at most ${BIO_MAX} characters.` },
      { status: 400 }
    );
  }

  try {
    const verified = await verifySocialRequest({
      action: "update_profile",
      wallet: payload.wallet,
      signature: payload.signature,
      timestamp: Number(payload.timestamp),
      displayName,
      bio,
    });

    const supabase = getSupabaseServiceClient();
    const wallet = verified.wallet.toLowerCase();

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        wallet_address: wallet,
        display_name: displayName,
        bio: bio || null,
      })
      .select("wallet_address, display_name, bio, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid profile update request.",
      },
      { status: 400 }
    );
  }
}
