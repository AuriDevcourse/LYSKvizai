"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, Users, PenLine } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const NAV_ITEMS = [
  { href: "/", icon: Home, labelKey: "nav.home" as const },
  { href: "/?action=create", icon: Users, labelKey: "nav.play" as const },
  { href: "/editor", icon: PenLine, labelKey: "nav.editor" as const },
];

/** Pages where the bottom nav should be hidden (home screen + active gameplay) */
const HIDDEN_PATTERNS = [/^\/quiz\//, /^\/play\/[A-Z0-9]/i, /^\/editor\//, /^\/survival/];

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasAction = searchParams.get("action");
  const { t } = useTranslation();

  if (HIDDEN_PATTERNS.some((p) => p.test(pathname))) return null;

  return (
    <>
    {/* Fade gradient above nav */}
    <div className="pointer-events-none fixed bottom-0 inset-x-0 z-40 h-28 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/60 to-transparent sm:hidden" />
    <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden">
      <div className="mx-3 mb-3 flex items-stretch justify-around rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/"
            ? pathname === "/" && !hasAction
            : item.href === "/?action=create"
              ? (pathname === "/" && hasAction === "create") || pathname === "/play"
              : pathname === item.href;
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
              <span className="text-[10px] font-bold">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}
