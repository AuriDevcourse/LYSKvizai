"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function LanguageToggle() {
  const { lang, setLang } = useTranslation();

  return (
    <div className="flex items-center rounded-full bg-white/10 p-0.5 text-xs font-bold">
      <button
        onClick={() => setLang("en")}
        className={`rounded-full px-2.5 py-1 transition-all ${
          lang === "en"
            ? "bg-white text-[#46178f]"
            : "text-white/60 hover:text-white"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("lt")}
        className={`rounded-full px-2.5 py-1 transition-all ${
          lang === "lt"
            ? "bg-white text-[#46178f]"
            : "text-white/60 hover:text-white"
        }`}
      >
        LT
      </button>
    </div>
  );
}
