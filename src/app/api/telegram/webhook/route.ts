import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body?.message;
  if (!message?.text || !message?.chat?.id) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const text = message.text.trim();

  // Parse /start CODE
  const match = text.match(/^\/start\s+([A-F0-9]{8})$/i);
  if (!match) {
    await sendTelegramMessage(chatId, "Send your verification code from Working Vocab settings to connect your account.");
    return NextResponse.json({ ok: true });
  }

  const code = match[1].toUpperCase();
  const supabase = await createServiceClient();

  const { data: settings } = await supabase
    .from("user_settings")
    .select("id, telegram_verification_code, telegram_verification_expires_at")
    .eq("telegram_verification_code", code)
    .single();

  if (!settings) {
    await sendTelegramMessage(chatId, "That code wasn't found. Generate a new one in Working Vocab settings.");
    return NextResponse.json({ ok: true });
  }

  if (new Date(settings.telegram_verification_expires_at) < new Date()) {
    await sendTelegramMessage(chatId, "That code has expired. Generate a new one in Working Vocab settings.");
    return NextResponse.json({ ok: true });
  }

  await supabase
    .from("user_settings")
    .update({
      telegram_chat_id: chatId,
      telegram_connected_at: new Date().toISOString(),
      telegram_verification_code: null,
      telegram_verification_expires_at: null,
    })
    .eq("id", settings.id);

  await sendTelegramMessage(chatId, "✓ Connected to Working Vocab. You'll receive your word notifications here.");
  return NextResponse.json({ ok: true });
}
