"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Words" },
  { href: "/add", label: "Add word" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const linkClass = (active: boolean) =>
    `flex items-center px-3 py-2 rounded-lg text-base transition-colors ${
      active
        ? "bg-gray-800 text-indigo-400 font-medium"
        : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
    }`;

  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">

      {/* Branding */}
      <div className="px-5 pt-6 pb-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">W</span>
          </div>
          <div>
            <p className="font-semibold text-gray-100 text-sm leading-tight">Working Vocab</p>
            <p className="text-gray-500 text-xs leading-tight">Build your vocabulary</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={linkClass(pathname === l.href)}>
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Bottom: About + Sign out */}
      <div className="px-3 py-4 space-y-0.5 border-t border-gray-800">
        <Link href="/about" className={linkClass(pathname === "/about")}>
          About
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center px-3 py-2 rounded-lg text-base text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
