"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const links = [
    { href: "/", label: "Words" },
    { href: "/add", label: "+ Add word" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-sm">
            Working Vocab
          </Link>
          <div className="flex items-center gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm ${
                  pathname === l.href
                    ? "text-indigo-600 font-medium"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-gray-400 hover:text-gray-700"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
