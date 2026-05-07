"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Word = {
  id: string;
  word: string;
  definition: Record<string, unknown>;
  part_of_speech: string;
  phonetic: string;
  status: "saved" | "practicing" | "working";
  notes: string;
  source_url: string;
  source_domain: string;
  created_at: string;
};

type Example = {
  id: string;
  text: string;
};

const STATUS_NEXT: Record<string, string> = {
  saved: "practicing",
  practicing: "working",
  working: "working",
};

const STATUS_LABELS: Record<string, string> = {
  saved: "Saved",
  practicing: "Practicing",
  working: "Working vocab",
};

const STATUS_COLORS: Record<string, string> = {
  saved: "bg-gray-100 text-gray-600",
  practicing: "bg-blue-100 text-blue-700",
  working: "bg-green-100 text-green-700",
};

export default function WordDetail({
  word: initialWord,
  initialExamples,
}: {
  word: Word;
  initialExamples: Example[];
}) {
  const [word, setWord] = useState(initialWord);
  const [examples, setExamples] = useState<Example[]>(initialExamples);
  const [notes, setNotes] = useState(initialWord.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [generatingExamples, setGeneratingExamples] = useState(examples.length === 0);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Auto-generate examples on first load if none exist
  useState(() => {
    if (examples.length === 0) {
      generateExamples();
    }
  });

  async function generateExamples() {
    setGeneratingExamples(true);
    const res = await fetch("/api/examples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id }),
    });
    const data = await res.json();
    if (data.examples) setExamples(data.examples);
    setGeneratingExamples(false);
  }

  async function advanceStatus() {
    const next = STATUS_NEXT[word.status];
    if (next === word.status) return;
    setUpdatingStatus(true);
    await supabase.from("words").update({ status: next }).eq("id", word.id);
    setWord((w) => ({ ...w, status: next as Word["status"] }));
    setUpdatingStatus(false);
  }

  async function saveNotes() {
    await supabase.from("words").update({ notes }).eq("id", word.id);
    setEditingNotes(false);
  }

  async function archiveWord() {
    await supabase.from("words").update({ archived: true }).eq("id", word.id);
    router.push("/");
    router.refresh();
  }

  const definition =
    typeof word.definition === "object" && word.definition !== null
      ? (word.definition as { meanings?: { definitions?: { definition: string }[] }[] })
          .meanings?.[0]?.definitions?.[0]?.definition
      : String(word.definition ?? "");

  return (
    <div className="max-w-2xl">
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">
        ← All words
      </Link>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{word.word}</h1>
            {word.phonetic && <p className="text-gray-400 text-sm mt-0.5">{word.phonetic}</p>}
          </div>
          <div className="flex items-center gap-2 mt-1 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[word.status]}`}>
              {STATUS_LABELS[word.status]}
            </span>
            {word.status !== "working" && (
              <button
                onClick={advanceStatus}
                disabled={updatingStatus}
                className="text-xs px-2.5 py-1 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50"
              >
                Mark as {STATUS_LABELS[STATUS_NEXT[word.status]]} →
              </button>
            )}
          </div>
        </div>

        {word.part_of_speech && (
          <p className="text-indigo-600 text-sm font-medium mt-3">{word.part_of_speech}</p>
        )}
        {definition && (
          <p className="text-gray-700 mt-1 leading-relaxed">{definition}</p>
        )}

        {word.source_url && (
          <a
            href={word.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mt-3"
          >
            From: {word.source_domain || new URL(word.source_url).hostname} ↗
          </a>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-gray-900">Dialogue examples</h2>
          <button
            onClick={generateExamples}
            disabled={generatingExamples}
            className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-50"
          >
            {generatingExamples ? "Generating…" : "↺ Regenerate"}
          </button>
        </div>

        {generatingExamples && examples.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {examples.map((ex) => (
              <div
                key={ex.id}
                className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line"
              >
                {ex.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="font-medium text-gray-900 mb-2">Notes</h2>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={saveNotes}
                className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700"
              >
                Save
              </button>
              <button
                onClick={() => { setNotes(word.notes ?? ""); setEditingNotes(false); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditingNotes(true)}
            className="text-sm text-gray-500 cursor-pointer hover:text-gray-800 min-h-8"
          >
            {notes || <span className="italic text-gray-300">Click to add notes…</span>}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={archiveWord}
          className="text-sm text-gray-400 hover:text-red-500"
        >
          Archive this word
        </button>
      </div>
    </div>
  );
}
