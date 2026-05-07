import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateDialogueExamples(
  word: string,
  definition: string,
  partOfSpeech: string,
  count = 4
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  const prompt = `Generate ${count} short, natural conversational dialogue examples using the word "${word}" (${partOfSpeech}: ${definition}).

Rules:
- Each example should be a brief realistic exchange (2-4 lines) between people in everyday conversation
- The word should be used naturally, the way an educated person would actually say it
- Vary the contexts (work, social, casual, etc.)
- Do NOT use quotation marks around "${word}" or call attention to it
- Return ONLY the examples, separated by "---", no numbering or labels

Example format:
"Did you hear what she said in the meeting?"
"Yeah, that comment was pretty ephemeral — everyone forgot about it by lunch."
---
"I keep a journal but most entries feel ephemeral, like they don't really capture anything."
"Maybe that's okay. Not everything needs to last."`;

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
