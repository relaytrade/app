import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseServerConfigured } from "@/lib/supabase/config";
import type { FeedPost, SuggestedTrader } from "@/lib/supabase/database.types";

export async function GET(request: Request) {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const walletParam = searchParams.get("wallet");

  let wallet: string | null = null;
  if (walletParam) {
    if (!isAddress(walletParam)) {
      return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
    }
    wallet = getAddress(walletParam).toLowerCase();
  }

  const supabase = getSupabaseServiceClient();

  let authorFilter: string[] | null = null;

  if (wallet) {
    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("following_address")
      .eq("follower_address", wallet);

    if (followsError) {
      return NextResponse.json({ error: followsError.message }, { status: 500 });
    }

    authorFilter = [
      wallet,
      ...(follows?.map((row) => row.following_address) ?? []),
    ];
  }

  let postsQuery = supabase
    .from("posts")
    .select("id, author_address, body, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (authorFilter && authorFilter.length > 0) {
    postsQuery = postsQuery.in("author_address", authorFilter);
  }

  const { data: posts, error: postsError } = await postsQuery;

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  const authorAddresses = [...new Set(posts?.map((post) => post.author_address) ?? [])];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("wallet_address, display_name")
    .in("wallet_address", authorAddresses);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

  const profileMap = new Map(
    profiles?.map((profile) => [profile.wallet_address, profile]) ?? []
  );

  const feed: FeedPost[] =
    posts?.map((post) => ({
      ...post,
      author: {
        wallet_address: post.author_address,
        display_name:
          profileMap.get(post.author_address)?.display_name ??
          truncateAddress(post.author_address),
      },
    })) ?? [];

  let suggested: SuggestedTrader[] = [];

  if (wallet) {
    const { data: traders, error: tradersError } = await supabase
      .from("profiles")
      .select("wallet_address, display_name, bio, created_at")
      .neq("wallet_address", wallet)
      .order("created_at", { ascending: true })
      .limit(12);

    if (tradersError) {
      return NextResponse.json({ error: tradersError.message }, { status: 500 });
    }

    const { data: myFollows, error: myFollowsError } = await supabase
      .from("follows")
      .select("following_address")
      .eq("follower_address", wallet);

    if (myFollowsError) {
      return NextResponse.json({ error: myFollowsError.message }, { status: 500 });
    }

    const followingSet = new Set(myFollows?.map((row) => row.following_address));

    suggested =
      traders?.map((trader) => ({
        ...trader,
        is_following: followingSet.has(trader.wallet_address),
      })) ?? [];
  }

  return NextResponse.json({ feed, suggested });
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
