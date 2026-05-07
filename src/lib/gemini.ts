import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateDialogueExamples(
  word: string,
  definition: string,
  partOfSpeech: string,
  count = 3
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Give ${count} two-line dialogue exchanges using "${word}" (${partOfSpeech}: ${definition}) naturally in conversation. Vary the context. Separate with ---. No labels, no numbering.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
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
