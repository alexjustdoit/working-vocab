import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWordNotifications } from "@/lib/notifications";

// cron-job.org calls this every 30 minutes. We check which users are due based on their settings.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const nowUTC = new Date();
  const currentHour = nowUTC.getUTCHours();
  const currentMinute = nowUTC.getUTCMinutes();
  const currentSlot = currentMinute < 30 ? 0 : 30;
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const currentDay = dayNames[nowUTC.getUTCDay()];

  // Fetch all users with at least one notification channel enabled
  const { data: allSettings } = await supabase
    .from("user_settings")
    .select("*")
    .or("notification_email.not.is.null,telegram_chat_id.not.is.null");

  if (!allSettings?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const settings of allSettings) {
    if (!settings.notif_channels?.length) continue;

    // Parse user's notification time in UTC
    const [userHour, userMinute] = (settings.notif_time ?? "08:00").split(":").map(Number);
    const offsetMinutes = settings.notif_time_utc_offset ?? 0;
    const totalUTCMinutes = ((userHour * 60 + userMinute - offsetMinutes) % 1440 + 1440) % 1440;
    const targetHour = Math.floor(totalUTCMinutes / 60);
    const targetSlot = totalUTCMinutes % 60 < 30 ? 0 : 30;

    if (targetHour !== currentHour || targetSlot !== currentSlot) continue;

    // Check frequency/day
    const freq = settings.notif_frequency ?? "daily";
    if (freq === "3x_week") {
      const days = settings.notif_days ?? ["mon", "wed", "fri"];
      if (!days.includes(currentDay)) continue;
    } else if (freq === "weekly") {
      const days = settings.notif_days ?? ["mon"];
      if (!days.includes(currentDay)) continue;
    }

    // Fetch practicing words, oldest-notified first
    const { data: words } = await supabase
      .from("words")
      .select("id, word, part_of_speech, definition")
      .eq("user_id", settings.id)
      .eq("status", "practicing")
      .eq("archived", false)
      .order("last_notified_at", { ascending: true, nullsFirst: true })
      .limit(settings.notif_word_count ?? 3);

    if (!words?.length) continue;

    const wordPayloads = words.map((w) => {
      const definitions: string[] = [];

      if (w.definition?.meanings?.length) {
        // Extract 1 definition from each meaning (shows all senses like the app)
        definitions.push(
          ...w.definition.meanings
            .map((m: { definitions?: { definition: string }[] }) =>
              m.definitions?.[0]?.definition ?? ""
            )
            .filter(Boolean)
        );
      }

      // Fallback to manual definition if no meanings found
      if (definitions.length === 0 && w.definition?.manual) {
        definitions.push(w.definition.manual);
      }

      return {
        word: w.word,
        part_of_speech: w.part_of_speech ?? "",
        definitions: definitions.length > 0 ? definitions : [""],
      };
    });

    await sendWordNotifications(
      wordPayloads,
      settings.notif_channels,
      settings.notification_email,
      settings.telegram_chat_id
    );

    // Update last_notified_at for these words
    await supabase
      .from("words")
      .update({ last_notified_at: new Date().toISOString() })
      .in("id", words.map((w) => w.id));

    sent++;
  }

  return NextResponse.json({ sent });
}
