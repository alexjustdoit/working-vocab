import AppShell from "@/components/AppShell";

export default function AboutPage() {
  return (
    <AppShell>
      <div className="max-w-xl">
        <h1 className="text-lg font-semibold text-gray-100 mb-8">About</h1>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What is this?</h2>
            <p>
              Working Vocab helps you move words from passive recognition into active use. There's a difference between
              knowing what a word means and actually being able to use it in conversation — that's your working vocabulary.
              This app closes that gap.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">How it works</h2>
            <ol className="space-y-3 list-none">
              <li className="flex gap-3">
                <span className="text-indigo-400 font-semibold shrink-0">1.</span>
                <span><strong className="text-gray-100">Save a word</strong> — type it in manually or use the bookmarklet to capture it while reading. The definition fills in automatically.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-400 font-semibold shrink-0">2.</span>
                <span><strong className="text-gray-100">See it in context</strong> — the app generates natural dialogue examples showing how real people would use the word in conversation.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-400 font-semibold shrink-0">3.</span>
                <span><strong className="text-gray-100">Mark it Practicing</strong> — words in this state get included in your periodic notifications, with fresh examples each time.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-400 font-semibold shrink-0">4.</span>
                <span><strong className="text-gray-100">Mark it Integrated</strong> — once you've used a word naturally a few times, mark it done. It stays in your list as a record.</span>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">The bookmarklet</h2>
            <p>
              The bookmarklet lives in your browser's bookmarks bar. While reading anything online, highlight a word and
              click it — the app opens with the word pre-filled and the source article saved so you can find it again.
              Set it up in <a href="/settings" className="text-indigo-400 hover:underline">Settings</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notifications</h2>
            <p>
              Connect Telegram in <a href="/settings" className="text-indigo-400 hover:underline">Settings</a> to
              receive periodic messages with a few of your practicing words, each shown in a new context. The goal
              is repeated low-friction exposure — the fastest way to make a word feel natural.
            </p>
          </section>

        </div>
      </div>
    </AppShell>
  );
}
