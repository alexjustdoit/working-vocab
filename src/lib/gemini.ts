import Groq from "groq-sdk";

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function generateDialogueExamples(
  word: string,
  definition: string,
  partOfSpeech: string,
  count = 3
): Promise<string[]> {
  const completion = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `Give ${count} two-line dialogue exchanges using "${word}" naturally in conversation. Definitions — ${definition}${partOfSpeech ? ` (${partOfSpeech})` : ""}. If multiple senses are listed, cover each one across the exchanges. Vary the context. Separate with ---. No labels, no numbering.`,
      },
    ],
    temperature: 0.9,
    max_tokens: 400,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  return text
    .split("---")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, count);
}

export async function reorderMeaningsByFrequency<
  T extends { partOfSpeech: string; definitions: { definition: string }[] }
>(word: string, meanings: T[]): Promise<T[]> {
  if (meanings.length <= 1) return meanings;
  try {
    const list = meanings
      .map((m, i) => `${i}: ${m.partOfSpeech} — ${m.definitions[0]?.definition ?? ""}`)
      .join("\n");
    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `The word "${word}" has these definitions:\n${list}\n\nReturn ONLY a comma-separated list of the indices reordered from most to least commonly used in modern English. Example: 2,0,1`,
        },
      ],
      temperature: 0,
      max_tokens: 20,
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    const indices = text.split(",").map((s) => parseInt(s.trim(), 10));
    if (
      indices.length === meanings.length &&
      indices.every((i) => !isNaN(i) && i >= 0 && i < meanings.length) &&
      new Set(indices).size === meanings.length
    ) {
      return indices.map((i) => meanings[i]);
    }
  } catch {
    // fall through to original order
  }
  return meanings;
}

export async function reorderDefinitionsByFrequency(
  word: string,
  partOfSpeech: string,
  definitions: { definition: string }[]
): Promise<{ definition: string }[]> {
  if (definitions.length <= 1) return definitions;
  try {
    const list = definitions
      .map((d, i) => `${i}: ${d.definition}`)
      .join("\n");
    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Rank these ${definitions.length} definitions for "${word}" (${partOfSpeech}) by how commonly they're used in modern English today. Most common first. You MUST return all ${definitions.length} indices.\n\n${list}\n\nReturn ONLY a comma-separated list of ALL indices 0-${definitions.length - 1} in your ranked order. No other text.`,
        },
      ],
      temperature: 0,
      max_tokens: 30,
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    const indices = text.split(",").map((s) => parseInt(s.trim(), 10));
    if (
      indices.length === definitions.length &&
      indices.every((i) => !isNaN(i) && i >= 0 && i < definitions.length) &&
      new Set(indices).size === definitions.length
    ) {
      console.log(`[reorderDefinitions] "${word}" reordered: ${text}`);
      return indices.map((i) => definitions[i]);
    } else {
      console.log(`[reorderDefinitions] "${word}" invalid response: "${text}" (expected ${definitions.length} indices)`);
    }
  } catch (error) {
    console.error(`[reorderDefinitions] Error for "${word}":`, error);
  }
  return definitions;
}

export async function generateSingleExample(
  word: string,
  definition: string,
  partOfSpeech: string
): Promise<string> {
  const examples = await generateDialogueExamples(word, definition, partOfSpeech, 1);
  return examples[0] ?? "";
}
