import { createClient } from "@supabase/supabase-js";
import { generateDialogueExamples } from "./gemini";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function generateAndStoreExamples(
  wordId: string,
  word: string,
  definition: string,
  partOfSpeech: string
) {
  const texts = await generateDialogueExamples(word, definition, partOfSpeech);
  const supabase = adminClient();
  await supabase.from("dialogue_examples").delete().eq("word_id", wordId);
  await supabase
    .from("dialogue_examples")
    .insert(texts.map((text) => ({ word_id: wordId, text })));
}
