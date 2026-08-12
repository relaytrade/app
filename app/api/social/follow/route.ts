import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseServerConfigured } from "@/lib/supabase/config";
import { verifySocialRequest } from "@/lib/social/verify";

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 }
    );
  }

  const payload = await request.json();
  const action = payload.action === "unfollow" ? "unfollow" : "follow";

  try {
    const verified = await verifySocialRequest({
      action,
      wallet: payload.wallet,
      signature: payload.signature,
      timestamp: Number(payload.timestamp),
      target: payload.target,
    });

    if (!verified.target) {
      return NextResponse.json({ error: "Missing follow target." }, { status: 400 });
    }

    const follower = verified.wallet.toLowerCase();
    const following = verified.target.toLowerCase();

    if (follower === following) {
      return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();

    await supabase.from("profiles").upsert([
      { wallet_address: follower, display_name: truncateAddress(follower) },
      { wallet_address: following, display_name: truncateAddress(following) },
    ]);

    if (action === "follow") {
      const { error } = await supabase.from("follows").upsert({
        follower_address: follower,
        following_address: following,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_address", follower)
        .eq("following_address", following);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, action, following });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid follow request." },
      { status: 400 }
    );
  }
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
