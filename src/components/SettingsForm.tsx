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

const inputClass = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelClass = "block text-sm font-medium text-gray-300 mb-1";
const sectionHeadingClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4";

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

  const botName = "WorkingVocabBot";

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  function toggleChannel(ch: string) {
    const current = settings.notif_channels ?? [];
    set("notif_channels", current.includes(ch) ? current.filter((c) => c !== ch) : [...current, ch]);
  }

  function toggleDay(d: string) {
    const current = settings.notif_days ?? [];
    set("notif_days", current.includes(d) ? current.filter((x) => x !== d) : [...current, d]);
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
        <h2 className={sectionHeadingClass}>Notifications</h2>
        <div className="space-y-5">

          <div>
            <label className={labelClass}>Notification email</label>
            <input
              type="email"
              value={settings.notification_email ?? ""}
              onChange={(e) => set("notification_email", e.target.value)}
              className={`w-full ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass}>Channels</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-not-allowed opacity-40" title="Email notifications require a verified sending domain — coming soon">
                <input
                  type="checkbox"
                  disabled
                  checked={false}
                  className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-300">Email</span>
                <span className="text-xs text-gray-500">(coming soon)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings.notif_channels ?? []).includes("telegram")}
                  onChange={() => toggleChannel("telegram")}
                  className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-300">Telegram</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>Frequency</label>
            <div className="flex gap-4">
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
                    className="border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {settings.notif_frequency !== "daily" && (
            <div>
              <label className={labelClass}>Days</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      (settings.notif_days ?? []).includes(d)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
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
              <label className={labelClass}>Time</label>
              <input
                type="time"
                value={settings.notif_time ?? "08:00"}
                onChange={(e) => set("notif_time", e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-gray-500 mt-1">Your local time</p>
            </div>
            <div>
              <label className={labelClass}>Words per message</label>
              <select
                value={settings.notif_word_count ?? 3}
                onChange={(e) => set("notif_word_count", Number(e.target.value))}
                className={inputClass}
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
        <h2 className={sectionHeadingClass}>Telegram</h2>
        <p className="text-sm text-gray-500 mb-4">
          Connect Telegram to receive word notifications as push messages on your phone.
        </p>

        {settings.telegram_chat_id ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-full">
              Connected
              {settings.telegram_connected_at &&
                ` · ${new Date(settings.telegram_connected_at).toLocaleDateString()}`}
            </span>
            <button onClick={disconnectTelegram} className="text-sm text-gray-500 hover:text-red-400 transition-colors">
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tgCode ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                <p className="text-sm text-gray-300">
                  1.{" "}
                  <a href={`https://t.me/${botName}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    Open @{botName} on Telegram
                  </a>
                </p>
                <p className="text-sm text-gray-300">2. Send this message to the bot:</p>
                <code className="block bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-gray-100 select-all">
                  /start {tgCode}
                </code>
                <p className="text-xs text-gray-500">Code expires in 15 minutes</p>
              </div>
            ) : (
              <button
                onClick={generateTelegramCode}
                disabled={tgLoading}
                className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                {tgLoading ? "Generating…" : "Connect Telegram"}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Bookmarklet */}
      <section>
        <h2 className={sectionHeadingClass}>Bookmarklet</h2>
        <p className="text-sm text-gray-500 mb-4">
          Drag this to your bookmarks bar. Highlight any word on a page and click it to save the word instantly.
        </p>
        <div className="flex items-center gap-3">
          <a
            href={bookmarkletCode}
            onClick={(e) => e.preventDefault()}
            draggable
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg cursor-grab select-none transition-colors"
          >
            + Working Vocab
          </a>
          <button onClick={copyBookmarklet} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            {bookmarkletCopied ? "Copied!" : "Copy code instead"}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          On mobile: copy the code, create a new bookmark manually, and paste it as the URL.
        </p>
      </section>

      {/* Save */}
      <div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
