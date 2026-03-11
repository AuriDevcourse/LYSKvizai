"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

// Client-side cache for translated content
const clientCache = new Map<string, string>();

function cacheKey(text: string, to: string): string {
  return `${to}:${text}`;
}

/**
 * Translate an array of strings when language is not Lithuanian.
 * Returns the translated strings (or originals while loading).
 */
export function useContentTranslation(texts: string[]): string[] {
  const { lang } = useTranslation();
  const [translated, setTranslated] = useState<string[]>(texts);
  const prevKey = useRef("");

  useEffect(() => {
    // Content is already in Lithuanian — no translation needed
    if (lang === "lt") {
      setTranslated(texts);
      return;
    }

    // Check if all are cached
    const key = texts.join("|||") + ":" + lang;
    if (key === prevKey.current) return;
    prevKey.current = key;

    const allCached = texts.every((t) => clientCache.has(cacheKey(t, lang)));
    if (allCached) {
      setTranslated(texts.map((t) => clientCache.get(cacheKey(t, lang)) ?? t));
      return;
    }

    // Show originals immediately, then translate
    setTranslated(texts);

    const controller = new AbortController();

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, from: "lt", to: lang }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.translated) {
          // Cache results
          for (let i = 0; i < texts.length; i++) {
            clientCache.set(cacheKey(texts[i], lang), data.translated[i]);
          }
          setTranslated(data.translated);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [texts, lang]);

  return lang === "lt" ? texts : translated;
}

/**
 * Translate a single string.
 */
export function useContentTranslationSingle(text: string): string {
  const result = useContentTranslation([text]);
  return result[0];
}
