"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Users, PenLine } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/play", icon: Users, label: "Play" },
  { href: "/editor", icon: PenLine, label: "Editor" },
];

/** Pages where the bottom nav should be hidden (active gameplay) */
const HIDDEN_PATTERNS = [/^\/quiz\//, /^\/play\/[A-Z0-9]/i, /^\/editor\//];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_PATTERNS.some((p) => p.test(pathname))) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden">
      <div className="mx-3 mb-3 flex items-stretch justify-around rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive
                  ? "text-white"
                  : "text-white/40 active:text-white/70"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
