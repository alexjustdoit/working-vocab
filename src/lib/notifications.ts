import { Resend } from "resend";
import { sendTelegramMessage } from "./telegram";
import { generateSingleExample } from "./gemini";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

interface WordForNotification {
  word: string;
  part_of_speech: string;
  definition: string;
}

export function formatNotificationMessage(words: WordForNotification[], examples: string[]): string {
  const lines: string[] = ["*Your words for today:*\n"];
  words.forEach((w, i) => {
    lines.push(`*${w.word}* _(${w.part_of_speech})_`);
    lines.push(`${w.definition}`);
    if (examples[i]) {
      lines.push(`\n${examples[i]}`);
    }
    lines.push("");
  });
  return lines.join("\n").trim();
}

export function formatEmailHtml(words: WordForNotification[], examples: string[]): string {
  const items = words
    .map((w, i) => {
      const example = examples[i]
        ? `<blockquote style="border-left:3px solid #e5e7eb;margin:12px 0;padding:0 12px;color:#6b7280;font-style:italic;white-space:pre-line">${examples[i]}</blockquote>`
        : "";
      return `
      <div style="margin-bottom:28px">
        <p style="margin:0;font-size:18px;font-weight:600;color:#111">${w.word} <span style="font-size:13px;font-weight:400;color:#9ca3af">${w.part_of_speech}</span></p>
        <p style="margin:4px 0 8px;color:#374151;font-size:15px">${w.definition}</p>
        ${example}
      </div>`;
    })
    .join("");

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
    <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Working Vocab</p>
    <h2 style="margin:0 0 24px;font-size:20px;font-weight:600">Your words for today</h2>
    ${items}
    <p style="margin-top:32px;font-size:13px;color:#9ca3af">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#6366f1;text-decoration:none">Open Working Vocab</a>
    </p>
  </div>`;
}

export async function sendWordNotifications(
  words: WordForNotification[],
  channels: string[],
  emailAddress?: string,
  telegramChatId?: string
) {
  const examples = await Promise.all(
    words.map((w) => generateSingleExample(w.word, w.definition, w.part_of_speech))
  );

  const results: { email?: boolean; telegram?: boolean } = {};

  if (channels.includes("email") && emailAddress) {
    try {
      const { error } = await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: emailAddress,
        subject: `Your words for today — Working Vocab`,
        html: formatEmailHtml(words, examples),
      });
      results.email = !error;
    } catch {
      results.email = false;
    }
  }

  if (channels.includes("telegram") && telegramChatId) {
    const message = formatNotificationMessage(words, examples);
    results.telegram = await sendTelegramMessage(telegramChatId, message);
  }

  return results;
}
