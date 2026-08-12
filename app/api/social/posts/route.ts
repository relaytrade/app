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
  const body = typeof payload.body === "string" ? payload.body.trim() : "";

  if (!body || body.length > 2000) {
    return NextResponse.json(
      { error: "Post body must be between 1 and 2000 characters." },
      { status: 400 }
    );
  }

  try {
    const verified = await verifySocialRequest({
      action: "post",
      wallet: payload.wallet,
      signature: payload.signature,
      timestamp: Number(payload.timestamp),
      body,
    });

    const supabase = getSupabaseServiceClient();
    const wallet = verified.wallet.toLowerCase();

    await supabase.from("profiles").upsert({
      wallet_address: wallet,
      display_name: truncateAddress(wallet),
    });

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_address: wallet,
        body,
      })
      .select("id, author_address, body, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid post request." },
      { status: 400 }
    );
  }
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
