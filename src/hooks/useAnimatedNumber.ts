"use client";

import { useEffect, useRef, useState } from "react";

/** Ease-out cubic — fast start, soft landing. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animate a number from its previous value to `target` over `duration` ms.
 * Returns the current interpolated value (re-renders as it ticks).
 * Typical use: `<span>+{useAnimatedNumber(points, 500)}</span>`.
 */
export function useAnimatedNumber(target: number, duration = 500): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number>(0);
  const lastTargetRef = useRef(target);

  useEffect(() => {
    if (target === lastTargetRef.current) return;
    fromRef.current = value;
    lastTargetRef.current = target;
    const start = performance.now();
    const from = fromRef.current;
    const delta = target - from;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);
      setValue(Math.round(from + delta * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}
