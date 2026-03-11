import translate from "google-translate-api-x";

// In-memory translation cache (persists via globalThis across HMR)
const g = globalThis as typeof globalThis & {
  __translation_cache?: Map<string, string>;
};
if (!g.__translation_cache) g.__translation_cache = new Map();
const cache = g.__translation_cache;

function cacheKey(text: string, from: string, to: string): string {
  return `${from}:${to}:${text}`;
}

/**
 * Translate a single string. Returns original on error.
 */
export async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string> {
  if (!text.trim()) return text;
  if (from === to) return text;

  const key = cacheKey(text, from, to);
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const res = await translate(text, { from, to });
    const translated = res.text;
    cache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
}

/**
 * Translate an array of strings in a single batch for efficiency.
 */
export async function translateBatch(
  texts: string[],
  from: string,
  to: string
): Promise<string[]> {
  if (from === to) return texts;

  // Check which ones need translation
  const results: string[] = new Array(texts.length);
  const toTranslate: { index: number; text: string }[] = [];

  for (let i = 0; i < texts.length; i++) {
    const key = cacheKey(texts[i], from, to);
    const cached = cache.get(key);
    if (cached) {
      results[i] = cached;
    } else if (!texts[i].trim()) {
      results[i] = texts[i];
    } else {
      toTranslate.push({ index: i, text: texts[i] });
    }
  }

  if (toTranslate.length === 0) return results;

  // Batch translate using separator
  const separator = "\n||||\n";
  const batchText = toTranslate.map((t) => t.text).join(separator);

  try {
    const res = await translate(batchText, { from, to });
    const parts = res.text.split(/\n?\|{4}\n?/);

    for (let i = 0; i < toTranslate.length; i++) {
      const translated = (parts[i] ?? toTranslate[i].text).trim();
      results[toTranslate[i].index] = translated;
      cache.set(cacheKey(toTranslate[i].text, from, to), translated);
    }
  } catch {
    // Fill in untranslated with originals
    for (const item of toTranslate) {
      if (!results[item.index]) results[item.index] = item.text;
    }
  }

  return results;
}
