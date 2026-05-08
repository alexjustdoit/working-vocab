import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAndStoreExamples } from "@/lib/examples";
import { buildDefinitionForAI } from "@/lib/dictionary";
import type { DictionaryEntry } from "@/lib/dictionary";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wordId } = await req.json();

  const { data: word } = await supabase
    .from("words")
    .select("*")
    .eq("id", wordId)
    .eq("user_id", user.id)
    .single();

  if (!word) return NextResponse.json({ error: "Word not found" }, { status: 404 });

  const hasMeanings = Array.isArray(word.definition?.meanings) && word.definition.meanings.length > 0;
  const definition = hasMeanings
    ? buildDefinitionForAI(word.definition as DictionaryEntry)
    : (word.definition?.manual ?? "");
  const pos = hasMeanings ? "" : (word.part_of_speech ?? "");

  try {
    await generateAndStoreExamples(wordId, word.word, definition, pos);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { data: examples } = await supabase
    .from("dialogue_examples")
    .select("*")
    .eq("word_id", wordId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ examples });
}
