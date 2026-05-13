"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Word = {
  id: string;
  word: string;
  part_of_speech: string;
  phonetic: string;
  status: "saved" | "practicing" | "working";
  notes: string;
  source_url: string;
  source_domain: string;
  created_at: string;
};

type SortKey = "created_at" | "word" | "status";

const STATUS_ORDER = { saved: 0, practicing: 1, working: 2 };
const STATUS_LABELS: Record<string, string> = {
  saved: "Saved",
  practicing: "Practicing",
  working: "Integrated",
};
const STATUS_COLORS: Record<string, string> = {
  saved: "bg-gray-800 text-gray-400",
  practicing: "bg-indigo-950 text-indigo-400",
  working: "bg-emerald-950 text-emerald-400",
};

export default function WordList({ initialWords }: { initialWords: Word[] }) {
  const [words, setWords] = useState<Word[]>(initialWords);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const supabase = createClient();

  const filtered = useMemo(() => {
    let result = words;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((w) => w.word.toLowerCase().includes(q));
    }
    if (filterStatus !== "all") {
      result = result.filter((w) => w.status === filterStatus);
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "word") cmp = a.word.localeCompare(b.word);
      else if (sortKey === "status") cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [words, search, filterStatus, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  async function archive(id: string) {
    await supabase.from("words").update({ archived: true }).eq("id", id);
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search words…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="saved">Saved</option>
          <option value="practicing">Practicing</option>
          <option value="working">Integrated</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          {search ? (
            <>
              <p className="text-base mb-2">No results for &ldquo;{search}&rdquo;</p>
              <p className="text-sm">
                <Link
                  href={`/add?word=${encodeURIComponent(search)}`}
                  className="text-indigo-400 hover:underline"
                >
                  Add &ldquo;{search}&rdquo; as a new word →
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="text-base mb-2">No words yet</p>
              <p className="text-sm">
                <Link href="/add" className="text-indigo-400 hover:underline">
                  Add your first word
                </Link>
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table view */}
          <div className="hidden sm:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-300"
                    onClick={() => toggleSort("word")}
                  >
                    Word<SortIcon k="word" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Part of speech
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-300"
                    onClick={() => toggleSort("status")}
                  >
                    Status<SortIcon k="status" />
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-300 hidden md:table-cell"
                    onClick={() => toggleSort("created_at")}
                  >
                    Added<SortIcon k="created_at" />
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((word) => (
                  <tr key={word.id} className="hover:bg-gray-800 group transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/words/${word.id}`}
                          className="font-medium text-gray-100 hover:text-indigo-400 transition-colors"
                        >
                          {word.word}
                        </Link>
                        {word.source_url && (
                          <a
                            href={word.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Source: ${word.source_domain}`}
                            className="text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ↗
                          </a>
                        )}
                      </div>
                      {word.phonetic && (
                        <p className="text-xs text-gray-500 mt-0.5">{word.phonetic}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {word.part_of_speech}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[word.status]}`}>
                        {STATUS_LABELS[word.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {new Date(word.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => archive(word.id)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden space-y-3">
            {filtered.map((word) => (
              <Link
                key={word.id}
                href={`/words/${word.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-indigo-600 transition-colors active:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-100 text-base truncate">
                      {word.word}
                    </h3>
                    {word.phonetic && (
                      <p className="text-xs text-gray-500 mt-0.5">{word.phonetic}</p>
                    )}
                  </div>
                  {word.source_url && (
                    <a
                      href={word.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-600 hover:text-gray-400 shrink-0"
                    >
                      ↗
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {word.part_of_speech}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[word.status]}`}>
                      {STATUS_LABELS[word.status]}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      archive(word.id);
                    }}
                    className="text-gray-600 hover:text-red-400 text-xs"
                  >
                    Archive
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
