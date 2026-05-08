import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { lookupWord, extractDefinitionSummary, buildDefinitionForAI } from "@/lib/dictionary";
import { generateAndStoreExamples } from "@/lib/examples";

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

  const rawEntry = await lookupWord(word);
  const resolved = rawEntry ? extractDefinitionSummary(rawEntry) : null;

  const { data, error } = await supabase
    .from("words")
    .insert({
      user_id: user.id,
      word: word.toLowerCase().trim(),
      definition: rawEntry ?? { manual: definition },
      part_of_speech: partOfSpeech || resolved?.partOfSpeech || "",
      phonetic: phonetic || resolved?.phonetic || "",
      notes,
      source_url: sourceUrl || null,
      source_domain: sourceUrl ? extractDomain(sourceUrl) : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate examples synchronously so they're ready when the detail page loads
  const def = rawEntry ? buildDefinitionForAI(rawEntry) : (definition || "");
  const pos = rawEntry ? "" : (partOfSpeech || resolved?.partOfSpeech || "");
  try {
    await generateAndStoreExamples(data.id, word.toLowerCase().trim(), def, pos);
  } catch {
    // Non-fatal — user can regenerate manually from the detail page
  }

  return NextResponse.json({ id: data.id });
}
