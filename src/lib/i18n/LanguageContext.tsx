"use client";

import type { ReactNode } from "react";
import { translations, type Language, type TranslationKey } from "./translations";

const lang: Language = "en";
const t = (key: TranslationKey): string => translations.en[key] ?? key;

export function LanguageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useTranslation() {
  return { lang, setLang: () => {}, t };
}
