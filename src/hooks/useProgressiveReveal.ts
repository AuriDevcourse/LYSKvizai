"use client";

import { useState, useEffect, useRef } from "react";

interface UseProgressiveRevealReturn {
  visibleWordCount: number;
  blurAmount: number;
  revealFraction: number;
}

/**
 * Hook for progressive reveal of question content.
 * Text reveals word-by-word, images go from blurred to clear.
 * @param totalWords - total number of words in the text
 * @param durationSeconds - total timer duration in seconds
 * @param enabled - whether progressive reveal is active
 */
export function useProgressiveReveal(
  totalWords: number,
  durationSeconds: number,
  enabled: boolean
): UseProgressiveRevealReturn {
  const [visibleWordCount, setVisibleWordCount] = useState(enabled ? 1 : totalWords);
  const [blurAmount, setBlurAmount] = useState(enabled ? 20 : 0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!enabled) {
      setVisibleWordCount(totalWords);
      setBlurAmount(0);
      return;
    }

    startRef.current = Date.now();
    setVisibleWordCount(1);
    setBlurAmount(20);

    // Reveal over 70% of the timer duration
    const revealDuration = durationSeconds * 0.7 * 1000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const fraction = Math.min(elapsed / revealDuration, 1);

      const words = Math.max(1, Math.ceil(fraction * totalWords));
      setVisibleWordCount(words);

      const blur = Math.max(0, 20 * (1 - fraction));
      setBlurAmount(blur);

      if (fraction >= 1) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [enabled, totalWords, durationSeconds]);

  const revealFraction = totalWords > 0 ? visibleWordCount / totalWords : 1;

  return { visibleWordCount, blurAmount, revealFraction };
}
