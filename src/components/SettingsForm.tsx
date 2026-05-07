"use client";

import { useState } from "react";

type Settings = {
  notification_email: string;
  notif_channels: string[];
  notif_frequency: string;
  notif_days: string[];
  notif_time: string;
  notif_time_utc_offset: number;
  notif_word_count: number;
  telegram_chat_id: string | null;
  telegram_connected_at: string | null;
};

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu",
  fri: "Fri", sat: "Sat", sun: "Sun",
};

export default function SettingsForm({
  initialSettings,
  appUrl,
}: {
  initialSettings: Settings;
  appUrl: string;
}) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tgCode, setTgCode] = useState<string | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);

  const botName = "WorkingVocabBot"; // update to actual bot username after creation

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  function toggleChannel(ch: string) {
    const current = settings.notif_channels ?? [];
    set(
      "notif_channels",
      current.includes(ch) ? current.filter((c) => c !== ch) : [...current, ch]
    );
  }

  function toggleDay(d: string) {
    const current = settings.notif_days ?? [];
    set(
      "notif_days",
      current.includes(d) ? current.filter((x) => x !== d) : [...current, d]
    );
  }

  async function save() {
    setSaving(true);
    const offset = -new Date().getTimezoneOffset();
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, notif_time_utc_offset: offset }),
    });
    setSaving(false);
    setSaved(true);
  }

  async function generateTelegramCode() {
    setTgLoading(true);
    const res = await fetch("/api/telegram/connect", { method: "POST" });
    const data = await res.json();
    setTgCode(data.code);
    setTgLoading(false);
  }

  async function disconnectTelegram() {
    await fetch("/api/telegram/connect", { method: "DELETE" });
    setSettings((s) => ({ ...s, telegram_chat_id: null, telegram_connected_at: null }));
    setTgCode(null);
  }

  const bookmarkletCode = `javascript:(function(){var w=window.getSelection().toString().trim();if(!w)return alert('Highlight a word first');window.open('${appUrl}/add?word='+encodeURIComponent(w)+'&source='+encodeURIComponent(location.href),'_blank');})();`;

  async function copyBookmarklet() {
    await navigator.clipboard.writeText(bookmarkletCode);
    setBookmarkletCopied(true);
    setTimeout(() => setBookmarkletCopied(false), 2000);
  }

  return (
    <div className="max-w-lg space-y-10">

      {/* Notifications */}
      <section>
        <h2 className="font-medium text-gray-900 mb-4">Notifications</h2>
        <div className="space-y-5">

          <div>
            <label className="block text-sm font-medium mb-1">Notification email</label>
            <input
              type="email"
              value={settings.notification_email ?? ""}
              onChange={(e) => set("notification_email", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Channels</label>
            <div className="flex gap-3">
              {["email", "telegram"].map((ch) => (
                <label key={ch} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(settings.notif_channels ?? []).includes(ch)}
                    onChange={() => toggleChannel(ch)}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <span className="text-sm capitalize">{ch}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Frequency</label>
            <div className="flex gap-3">
              {[
                { value: "daily", label: "Daily" },
                { value: "3x_week", label: "3x/week" },
                { value: "weekly", label: "Weekly" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="frequency"
                    value={opt.value}
                    checked={settings.notif_frequency === opt.value}
                    onChange={() => set("notif_frequency", opt.value)}
                    className="text-indigo-600"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {settings.notif_frequency !== "daily" && (
            <div>
              <label className="block text-sm font-medium mb-2">Days</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      (settings.notif_days ?? []).includes(d)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {DAY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input
                type="time"
                value={settings.notif_time ?? "08:00"}
                onChange={(e) => set("notif_time", e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">Your local time</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Words per message</label>
              <select
                value={settings.notif_word_count ?? 3}
                onChange={(e) => set("notif_word_count", Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Telegram */}
      <section>
        <h2 className="font-medium text-gray-900 mb-1">Telegram</h2>
        <p className="text-sm text-gray-500 mb-4">
          Connect Telegram to receive word notifications as push messages on your phone.
        </p>

        {settings.telegram_chat_id ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
              Connected
              {settings.telegram_connected_at &&
                ` · ${new Date(settings.telegram_connected_at).toLocaleDateString()}`}
            </span>
            <button
              onClick={disconnectTelegram}
              className="text-sm text-gray-400 hover:text-red-500"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tgCode ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700">
                  1.{" "}
                  <a
                    href={`https://t.me/${botName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Open @{botName} on Telegram
                  </a>
                </p>
                <p className="text-sm text-gray-700">
                  2. Send this message to the bot:
                </p>
                <code className="block bg-white border border-gray-200 rounded px-3 py-2 text-sm font-mono select-all">
                  /start {tgCode}
                </code>
                <p className="text-xs text-gray-400">Code expires in 15 minutes</p>
              </div>
            ) : (
              <button
                onClick={generateTelegramCode}
                disabled={tgLoading}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {tgLoading ? "Generating…" : "Connect Telegram"}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Bookmarklet */}
      <section>
        <h2 className="font-medium text-gray-900 mb-1">Bookmarklet</h2>
        <p className="text-sm text-gray-500 mb-4">
          Drag this to your bookmarks bar. Highlight any word on a page and click it to save the word instantly.
        </p>
        <div className="flex items-center gap-3">
          <a
            href={bookmarkletCode}
            onClick={(e) => e.preventDefault()}
            draggable
            className="inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg cursor-grab select-none"
          >
            + Working Vocab
          </a>
          <button
            onClick={copyBookmarklet}
            className="text-sm text-gray-400 hover:text-gray-700"
          >
            {bookmarkletCopied ? "Copied!" : "Copy code instead"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          On mobile: copy the code, create a new bookmark manually, and paste it as the URL.
        </p>
      </section>

      {/* Save */}
      <div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
