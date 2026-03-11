"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

// Client-side cache for translated content
const clientCache = new Map<string, string>();

function cacheKey(text: string, to: string): string {
  return `${to}:${text}`;
}

/**
 * Resolve as many texts as possible from cache synchronously.
 * Returns fully resolved array + whether all were resolved.
 */
function resolveFromCache(texts: string[], lang: string): { result: string[]; complete: boolean } {
  if (lang === "lt") return { result: texts, complete: true };
  let complete = true;
  const result: string[] = new Array(texts.length);
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    if (!t || !t.trim()) {
      result[i] = t ?? "";
      continue;
    }
    const cached = clientCache.get(cacheKey(t, lang));
    if (cached) {
      result[i] = cached;
    } else {
      result[i] = t;
      complete = false;
    }
  }
  return { result, complete };
}

export function useContentTranslation(texts: string[]): string[] {
  const { lang } = useTranslation();
  const textsKey = texts.join("\n||||\n");
  const stableTexts = useMemo(() => texts, [textsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve synchronously from cache on every render — no flash for cached content
  const { result: syncResolved, complete } = resolveFromCache(stableTexts, lang);

  const [asyncTranslated, setAsyncTranslated] = useState<string[] | null>(null);
  const prevKey = useRef("");
  const fetchingKey = useRef("");

  useEffect(() => {
    if (lang === "lt" || complete) {
      setAsyncTranslated(null);
      return;
    }

    const key = textsKey + ":" + lang;
    if (key === prevKey.current) return;
    prevKey.current = key;
    fetchingKey.current = key;

    const nonEmpty = stableTexts.filter((t) => t && t.trim() && !clientCache.has(cacheKey(t, lang)));
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
        if (data.translated && fetchingKey.current === key) {
          for (let i = 0; i < nonEmpty.length; i++) {
            if (data.translated[i]) {
              clientCache.set(cacheKey(nonEmpty[i], lang), data.translated[i]);
            }
          }
          // Trigger re-render so syncResolved picks up new cache entries
          setAsyncTranslated(
            stableTexts.map((t) => {
              if (!t || !t.trim()) return t;
              return clientCache.get(cacheKey(t, lang)) ?? t;
            })
          );
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [stableTexts, lang, textsKey, complete]);

  if (lang === "lt") return stableTexts;
  if (complete) return syncResolved;
  return asyncTranslated ?? syncResolved;
}

/**
 * Translate a single string.
 */
export function useContentTranslationSingle(text: string): string {
  const result = useContentTranslation([text]);
  return result[0];
}

/**
 * Pre-translate an array of strings and warm the client cache.
 * Call this before rendering so useContentTranslation resolves synchronously.
 * Returns a promise that resolves when all translations are cached.
 */
export async function preTranslateContent(
  texts: string[],
  lang: string
): Promise<void> {
  if (lang === "lt") return;

  // Filter to only uncached, non-empty strings (deduplicate)
  const seen = new Set<string>();
  const toTranslate: string[] = [];
  for (const t of texts) {
    if (!t || !t.trim()) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    if (!clientCache.has(cacheKey(t, lang))) {
      toTranslate.push(t);
    }
  }

  if (toTranslate.length === 0) return;

  // Batch in chunks of 80 to stay under API limit
  const CHUNK = 80;
  for (let i = 0; i < toTranslate.length; i += CHUNK) {
    const chunk = toTranslate.slice(i, i + CHUNK);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: chunk, from: "lt", to: lang }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.translated) {
        for (let j = 0; j < chunk.length; j++) {
          if (data.translated[j]) {
            clientCache.set(cacheKey(chunk[j], lang), data.translated[j]);
          }
        }
      }
    } catch {
      // Silently fail — individual questions will still try per-question translation
    }
  }
}
