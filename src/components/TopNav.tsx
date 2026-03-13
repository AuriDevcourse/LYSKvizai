"use client";

import { usePathname } from "next/navigation";
import LanguageToggle from "@/components/LanguageToggle";

/** Pages where the top nav should be hidden (active gameplay) */
const HIDDEN_PATTERNS = [/^\/quiz\//, /^\/play\/[A-Z0-9]/i, /^\/editor\//, /^\/survival/];

export default function TopNav() {
  const pathname = usePathname();

  if (HIDDEN_PATTERNS.some((p) => p.test(pathname))) return null;

  return (
    <div className="fixed right-3 top-3 z-50 hidden sm:block">
      <LanguageToggle />
    </div>
  );
}
