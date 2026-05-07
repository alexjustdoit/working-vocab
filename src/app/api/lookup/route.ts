import { NextRequest, NextResponse } from "next/server";
import { lookupWord, extractDefinitionSummary } from "@/lib/dictionary";

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get("word");
  if (!word) return NextResponse.json({ found: false });

  const entry = await lookupWord(word);
  if (!entry) return NextResponse.json({ found: false });

  const { phonetic, partOfSpeech, definition } = extractDefinitionSummary(entry);
  return NextResponse.json({ found: true, phonetic, partOfSpeech, definition, raw: entry });
}
