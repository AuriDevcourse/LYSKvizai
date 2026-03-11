"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  // Stabilize the texts array using a string key to avoid re-renders
  const textsKey = texts.join("\n||||\n");
  const stableTexts = useMemo(() => texts, [textsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [translated, setTranslated] = useState<string[]>(stableTexts);
  const prevKey = useRef("");

  useEffect(() => {
    // Content is already in Lithuanian — no translation needed
    if (lang === "lt") {
      setTranslated(stableTexts);
      return;
    }

    const key = textsKey + ":" + lang;
    if (key === prevKey.current) return;
    prevKey.current = key;

    // Check if all are cached
    const allCached = stableTexts.every((t) => !t || clientCache.has(cacheKey(t, lang)));
    if (allCached) {
      setTranslated(stableTexts.map((t) => (t ? clientCache.get(cacheKey(t, lang)) ?? t : t)));
      return;
    }

    // Show originals immediately, then translate
    setTranslated(stableTexts);

    // Filter out empty strings for the API call
    const nonEmpty = stableTexts.filter((t) => t && t.trim());
    if (nonEmpty.length === 0) return;

    const controller = new AbortController();

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: nonEmpty, from: "lt", to: lang }),
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error("Translation failed");
        return r.json();
      })
      .then((data) => {
        if (data.translated) {
          // Cache non-empty results
          for (let i = 0; i < nonEmpty.length; i++) {
            if (data.translated[i]) {
              clientCache.set(cacheKey(nonEmpty[i], lang), data.translated[i]);
            }
          }
          // Rebuild full array with translations
          setTranslated(
            stableTexts.map((t) => {
              if (!t || !t.trim()) return t;
              return clientCache.get(cacheKey(t, lang)) ?? t;
            })
          );
        }
      })
      .catch(() => {
        // Silently fail — show originals
      });

    return () => controller.abort();
  }, [stableTexts, lang, textsKey]);

  return lang === "lt" ? stableTexts : translated;
}

/**
 * Translate a single string.
 */
export function useContentTranslationSingle(text: string): string {
  const result = useContentTranslation([text]);
  return result[0];
}
