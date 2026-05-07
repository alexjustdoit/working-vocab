import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDialogueExamples } from "@/lib/gemini";

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

  const definition =
    word.definition?.meanings?.[0]?.definitions?.[0]?.definition ??
    word.definition?.manual ??
    "";

  const texts = await generateDialogueExamples(word.word, definition, word.part_of_speech ?? "");

  // Delete old examples and insert fresh ones
  await supabase.from("dialogue_examples").delete().eq("word_id", wordId);

  const { data: examples } = await supabase
    .from("dialogue_examples")
    .insert(texts.map((text) => ({ word_id: wordId, text })))
    .select();

  return NextResponse.json({ examples });
}
