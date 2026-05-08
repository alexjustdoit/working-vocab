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
        content: `Give ${count} two-line dialogue exchanges using "${word}" naturally in conversation. Definitions — ${definition}${partOfSpeech ? ` (${partOfSpeech})` : ""}. Use the most commonly used modern sense. Vary the context. Separate with ---. No labels, no numbering.`,
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

export async function generateSingleExample(
  word: string,
  definition: string,
  partOfSpeech: string
): Promise<string> {
  const examples = await generateDialogueExamples(word, definition, partOfSpeech, 1);
  return examples[0] ?? "";
}
