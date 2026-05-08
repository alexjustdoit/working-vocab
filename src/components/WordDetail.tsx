"use client";

import { useState, useEffect } from "react";
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

type Example = { id: string; text: string };

type Meaning = {
  partOfSpeech: string;
  definitions: { definition: string }[];
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
  saved: "bg-gray-800 text-gray-400",
  practicing: "bg-indigo-950 text-indigo-400",
  working: "bg-emerald-950 text-emerald-400",
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
  const [examplesError, setExamplesError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (examples.length === 0) generateExamples();
  }, []);

  async function generateExamples() {
    setGeneratingExamples(true);
    setExamplesError("");
    try {
      const res = await fetch("/api/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: word.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExamplesError(data.error ?? "Generation failed");
      } else if (data.examples?.length) {
        setExamples(data.examples);
      } else {
        setExamplesError("No examples returned — try Regenerate");
      }
    } catch (e) {
      setExamplesError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGeneratingExamples(false);
    }
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

  const meanings: Meaning[] = (() => {
    if (!word.definition || typeof word.definition !== "object") return [];
    const def = word.definition as { meanings?: Meaning[]; manual?: string };
    if (def.meanings?.length) return def.meanings;
    if (def.manual) return [{ partOfSpeech: word.part_of_speech || "", definitions: [{ definition: def.manual }] }];
    return [];
  })();

  return (
    <div className="max-w-2xl">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 mb-8 inline-block transition-colors">
        ← All words
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-3xl font-semibold text-gray-100">{word.word}</h1>
            {word.phonetic && <p className="text-gray-500 text-sm mt-1">{word.phonetic}</p>}
          </div>
          <div className="flex items-center gap-2 mt-1 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[word.status]}`}>
              {STATUS_LABELS[word.status]}
            </span>
            {word.status !== "working" && (
              <button
                onClick={advanceStatus}
                disabled={updatingStatus}
                className="text-xs px-2.5 py-1 border border-gray-700 rounded-full text-gray-400 hover:bg-gray-800 hover:text-gray-100 disabled:opacity-50 transition-colors"
              >
                Mark as {STATUS_LABELS[STATUS_NEXT[word.status]]} →
              </button>
            )}
          </div>
        </div>

        {meanings.length > 0 && (
          <div className="mt-2 space-y-2">
            {meanings.map((m, i) => (
              <div key={i}>
                {m.partOfSpeech && (
                  <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wide">{m.partOfSpeech}</p>
                )}
                <div className="mt-0.5 space-y-0.5">
                  {m.definitions.slice(0, 3).map((d, j) => (
                    <p key={j} className="text-gray-300 text-sm leading-relaxed">
                      {m.definitions.length > 1 ? <span className="text-gray-500 mr-1">{j + 1}.</span> : null}
                      {d.definition}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {word.source_url && (
          <a
            href={word.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mt-3 transition-colors"
          >
            From: {word.source_domain || new URL(word.source_url).hostname} ↗
          </a>
        )}
      </div>

      {/* Dialogue examples */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dialogue examples</h2>
          <button
            onClick={generateExamples}
            disabled={generatingExamples}
            className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50 transition-colors"
          >
            {generatingExamples ? "Generating…" : "↺ Regenerate"}
          </button>
        </div>

        {generatingExamples && examples.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : examplesError ? (
          <p className="text-sm text-red-400">{examplesError}</p>
        ) : (
          <div className="space-y-3">
            {examples.map((ex) => (
              <div
                key={ex.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 leading-relaxed whitespace-pre-line"
              >
                {ex.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notes</h2>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={saveNotes}
                className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => { setNotes(word.notes ?? ""); setEditingNotes(false); }}
                className="text-sm text-gray-500 hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditingNotes(true)}
            className="text-sm text-gray-400 cursor-pointer hover:text-gray-200 min-h-8 transition-colors"
          >
            {notes || <span className="italic text-gray-600">Click to add notes…</span>}
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 pt-5">
        <button
          onClick={archiveWord}
          className="text-sm text-gray-600 hover:text-red-400 transition-colors"
        >
          Archive this word
        </button>
      </div>
    </div>
  );
}
