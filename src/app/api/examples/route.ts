import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAndStoreExamples } from "@/lib/examples";

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

  await generateAndStoreExamples(wordId, word.word, definition, word.part_of_speech ?? "");

  const { data: examples } = await supabase
    .from("dialogue_examples")
    .select("*")
    .eq("word_id", wordId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ examples });
}
