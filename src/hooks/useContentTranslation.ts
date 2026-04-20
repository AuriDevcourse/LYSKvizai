"use client";

// English-only app — no runtime translation. This file is kept so existing
// call sites compile without edits; everything is a pass-through.

export function useContentTranslation(texts: string[]): string[] {
  return texts;
}

export function useContentTranslationSingle(text: string): string {
  return text;
}

export async function preTranslateContent(): Promise<void> {
  // no-op
}
