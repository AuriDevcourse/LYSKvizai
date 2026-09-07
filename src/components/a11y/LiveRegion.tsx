"use client";

import { useEffect, useRef } from "react";

/**
 * A single polite live region for the game.
 *
 * The app had no `aria-live` anywhere (WCAG 4.1.3). Everything that makes this
 * a live event — someone being eliminated, the connection dropping, how many
 * players have answered — changed silently, so a screen-reader user got the
 * lobby, then nothing, then a score.
 *
 * One region rather than several, because concurrent live regions interrupt
 * each other and the result is worse than silence.
 */
export default function LiveRegion({ message }: { message: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const flip = useRef(false);

  /**
   * The text is written straight to the node rather than rendered.
   *
   * A live region is a platform API, not React state — this is the case the
   * effect rules are actually for, and driving it through `useState` means an
   * extra render per announcement.
   *
   * The alternating zero-width space matters: assistive technology speaks a
   * live region when its contents *change*, so the same message twice in a row
   * — two players eliminated the same way, say — would render an identical
   * string and the second event would never be spoken. The space forces a
   * change without altering what is read aloud.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!message) {
      el.textContent = "";
      return;
    }
    flip.current = !flip.current;
    el.textContent = message + (flip.current ? "​" : "");
  }, [message]);

  return <div ref={ref} aria-live="polite" aria-atomic="true" className="sr-only" />;
}
