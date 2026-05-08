export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
    synonyms: string[];
  }[];
}

export async function lookupWord(word: string): Promise<DictionaryEntry | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim().toLowerCase())}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // Merge all entries, combining definitions under the same part of speech
    const base = data[0] as DictionaryEntry;
    const merged = new Map<string, DictionaryEntry["meanings"][0]>();
    for (const entry of data as DictionaryEntry[]) {
      for (const meaning of entry.meanings) {
        if (merged.has(meaning.partOfSpeech)) {
          const existing = merged.get(meaning.partOfSpeech)!;
          existing.definitions.push(...meaning.definitions);
          existing.synonyms = [...new Set([...existing.synonyms, ...meaning.synonyms])];
        } else {
          merged.set(meaning.partOfSpeech, { ...meaning, definitions: [...meaning.definitions] });
        }
      }
    }

    // Top-level `phonetic` is often missing; fall back to the phonetics array
    const rawBase = data[0] as DictionaryEntry & { phonetics?: { text?: string }[] };
    const phonetic =
      rawBase.phonetic ??
      rawBase.phonetics?.find((p) => p.text)?.text ??
      "";

    return { ...base, phonetic, meanings: Array.from(merged.values()) };
  } catch {
    return null;
  }
}

export function extractDefinitionSummary(entry: DictionaryEntry): {
  phonetic: string;
  partOfSpeech: string;
  definition: string;
} {
  const firstMeaning = entry.meanings[0];
  return {
    phonetic: entry.phonetic ?? "",
    partOfSpeech: firstMeaning?.partOfSpeech ?? "",
    definition: firstMeaning?.definitions[0]?.definition ?? "",
  };
}

/** Builds a compact multi-definition string for AI prompts. */
export function buildDefinitionForAI(entry: DictionaryEntry): string {
  return entry.meanings
    .slice(0, 3)
    .map((m) => {
      const defs = m.definitions
        .slice(0, 3)
        .map((d, i) => `${i + 1}. ${d.definition}`)
        .join(" ");
      return `${m.partOfSpeech}: ${defs}`;
    })
    .join("; ");
}
