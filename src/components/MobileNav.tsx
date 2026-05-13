"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { href: "/", label: "Words", icon: "📚" },
    { href: "/add", label: "Add", icon: "➕" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-gray-900 border-t border-gray-800 flex justify-around items-center h-16 px-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center justify-center flex-1 py-2 rounded-lg transition-colors ${
            isActive(item.href)
              ? "text-indigo-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <span className="text-xl mb-0.5">{item.icon}</span>
          <span className="text-xs font-medium">{item.label}</span>
        </Link>
      ))}
      <button
        onClick={signOut}
        className="flex flex-col items-center justify-center flex-1 py-2 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
      >
        <span className="text-xl mb-0.5">🚪</span>
        <span className="text-xs font-medium">Out</span>
      </button>
    </nav>
  );
}
