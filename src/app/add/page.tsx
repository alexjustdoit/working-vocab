"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Suspense } from "react";

type Meaning = {
  partOfSpeech: string;
  definitions: { definition: string }[];
};

const inputClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelClass = "block text-sm font-medium text-gray-300 mb-1";

function AddWordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [word, setWord] = useState(searchParams.get("word") ?? "");
  const [definition, setDefinition] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [notes, setNotes] = useState("");
  const [meanings, setMeanings] = useState<Meaning[]>([]);
  const [sourceUrl] = useState(searchParams.get("source") ?? "");
  const [looking, setLooking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (word.trim().length > 2) {
      const timer = setTimeout(() => lookupWord(word.trim()), 500);
      return () => clearTimeout(timer);
    } else {
      setMeanings([]);
      setNotFound(false);
    }
  }, [word]);

  async function lookupWord(w: string) {
    setLooking(true);
    setNotFound(false);
    setMeanings([]);
    try {
      const res = await fetch(`/api/lookup?word=${encodeURIComponent(w)}`);
      const data = await res.json();
      if (data.found) {
        setMeanings(data.raw?.meanings ?? []);
        setDefinition(data.definition ?? "");
        setPartOfSpeech(data.partOfSpeech ?? "");
        setPhonetic(data.phonetic ?? "");
      } else {
        setNotFound(true);
        setDefinition("");
        setPartOfSpeech("");
        setPhonetic("");
      }
    } finally {
      setLooking(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, definition, partOfSpeech, phonetic, notes, sourceUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to save word");
      setSaving(false);
    } else {
      router.push(`/words/${data.id}`);
    }
  }

  const fromDictionary = meanings.length > 0;

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div>
        <label className={labelClass}>Word</label>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          required
          placeholder="e.g. ephemeral"
          className={inputClass}
        />
        {looking && <p className="text-xs text-gray-400 mt-1">Looking up definition…</p>}
        {notFound && <p className="text-xs text-amber-500 mt-1">Not found in dictionary — fill in manually.</p>}
      </div>

      {fromDictionary ? (
        <div>
          <label className={labelClass}>Definition</label>
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 space-y-3">
            {meanings.map((m, i) => (
              <div key={i}>
                {m.partOfSpeech && (
                  <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wide">{m.partOfSpeech}</p>
                )}
                <div className="mt-0.5 space-y-0.5">
                  {m.definitions.slice(0, 3).map((d, j) => (
                    <p key={j} className="text-gray-300 text-sm leading-relaxed">
                      {m.definitions.length > 1 && (
                        <span className="text-gray-500 mr-1">{j + 1}.</span>
                      )}
                      {d.definition}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div>
            <label className={labelClass}>Definition</label>
            <textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={3}
              placeholder="Auto-fills from dictionary lookup"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Part of speech</label>
            <input
              type="text"
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              placeholder="noun, verb…"
              className={inputClass}
            />
          </div>
        </>
      )}

      <div>
        <label className={labelClass}>Phonetic</label>
        <input
          type="text"
          value={phonetic}
          onChange={(e) => setPhonetic(e.target.value)}
          placeholder="/ɪˈfem.ər.əl/"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          Notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any context you want to remember"
          className={inputClass}
        />
      </div>

      {sourceUrl && (
        <p className="text-xs text-gray-400">
          Source: <span className="font-mono">{new URL(sourceUrl).hostname}</span>
        </p>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving || !word.trim()}
        className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save word"}
      </button>
    </form>
  );
}

export default function AddPage() {
  return (
    <AppShell>
      <h1 className="text-lg font-semibold text-gray-100 mb-8">Add a word</h1>
      <Suspense>
        <AddWordForm />
      </Suspense>
    </AppShell>
  );
}
