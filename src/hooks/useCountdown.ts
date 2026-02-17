"use client";

import { useState, useEffect, useRef } from "react";

interface UseCountdownReturn {
  /** Seconds remaining (fractional) */
  remaining: number;
  /** 0-1 fraction of time left */
  fraction: number;
  /** Display seconds (ceiled integer) */
  displaySeconds: number;
  /** Whether the timer has expired */
  expired: boolean;
}

export function useCountdown(
  duration: number,
  startTime: number,
  onExpire?: () => void
): UseCountdownReturn {
  const [remaining, setRemaining] = useState(duration);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);

      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [duration, startTime, onExpire]);

  return {
    remaining,
    fraction: remaining / duration,
    displaySeconds: Math.ceil(remaining),
    expired: remaining <= 0,
  };
}
