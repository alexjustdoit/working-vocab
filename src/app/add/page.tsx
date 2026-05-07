"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { Suspense } from "react";

function AddWordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [word, setWord] = useState(searchParams.get("word") ?? "");
  const [definition, setDefinition] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [notes, setNotes] = useState("");
  const [sourceUrl] = useState(searchParams.get("source") ?? "");
  const [looking, setLooking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (word.trim().length > 2) {
      const timer = setTimeout(() => lookupWord(word.trim()), 500);
      return () => clearTimeout(timer);
    }
  }, [word]);

  async function lookupWord(w: string) {
    setLooking(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/lookup?word=${encodeURIComponent(w)}`);
      const data = await res.json();
      if (data.found) {
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

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">Word</label>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          required
          placeholder="e.g. ephemeral"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {looking && <p className="text-xs text-gray-400 mt-1">Looking up definition…</p>}
        {notFound && <p className="text-xs text-amber-500 mt-1">Word not found in dictionary — fill in manually.</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Definition</label>
        <textarea
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          rows={3}
          placeholder="Definition will auto-fill from lookup"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Part of speech</label>
          <input
            type="text"
            value={partOfSpeech}
            onChange={(e) => setPartOfSpeech(e.target.value)}
            placeholder="noun, verb…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phonetic</label>
          <input
            type="text"
            value={phonetic}
            onChange={(e) => setPhonetic(e.target.value)}
            placeholder="/ɪˈfem.ər.əl/"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any context you want to remember"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {sourceUrl && (
        <p className="text-xs text-gray-400">
          Source: <span className="font-mono">{new URL(sourceUrl).hostname}</span>
        </p>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving || !word.trim()}
        className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save word"}
      </button>
    </form>
  );
}

export default function AddPage() {
  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-6">Add a word</h1>
        <Suspense>
          <AddWordForm />
        </Suspense>
      </main>
    </>
  );
}
