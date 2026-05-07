import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await supabase
    .from("user_settings")
    .update({
      telegram_verification_code: code,
      telegram_verification_expires_at: expires.toISOString(),
    })
    .eq("id", user.id);

  return NextResponse.json({ code });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("user_settings")
    .update({
      telegram_chat_id: null,
      telegram_connected_at: null,
      telegram_verification_code: null,
      telegram_verification_expires_at: null,
    })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
