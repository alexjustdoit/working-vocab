import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { lookupWord } from "@/lib/dictionary";

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { word, definition, partOfSpeech, phonetic, notes, sourceUrl } = await req.json();

  // Fetch full raw definition for storage
  const rawEntry = await lookupWord(word);

  const { data, error } = await supabase
    .from("words")
    .insert({
      user_id: user.id,
      word: word.toLowerCase().trim(),
      definition: rawEntry ?? { manual: definition },
      part_of_speech: partOfSpeech,
      phonetic,
      notes,
      source_url: sourceUrl || null,
      source_domain: sourceUrl ? extractDomain(sourceUrl) : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
