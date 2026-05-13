import { NextRequest, NextResponse } from "next/server";
import { lookupWord, extractDefinitionSummary } from "@/lib/dictionary";
import { reorderMeaningsByFrequency, reorderDefinitionsByFrequency } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get("word");
  if (!word) return NextResponse.json({ found: false });

  let entry = await lookupWord(word);
  if (!entry) return NextResponse.json({ found: false });

  // Reorder meanings and definitions by modern usage frequency
  entry.meanings = await reorderMeaningsByFrequency(word.toLowerCase().trim(), entry.meanings);
  for (const meaning of entry.meanings) {
    meaning.definitions = await reorderDefinitionsByFrequency(
      word.toLowerCase().trim(),
      meaning.partOfSpeech,
      meaning.definitions
    );
  }

  const { phonetic, partOfSpeech, definition } = extractDefinitionSummary(entry);
  return NextResponse.json({ found: true, phonetic, partOfSpeech, definition, raw: entry });
}
