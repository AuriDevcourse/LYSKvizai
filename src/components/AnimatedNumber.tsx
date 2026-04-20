"use client";

import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/** Counts up from previous value to `value` using a short RAF animation. */
export default function AnimatedNumber({
  value,
  duration = 500,
  className,
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  const display = useAnimatedNumber(value, duration);
  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
