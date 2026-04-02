"use client";

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${
              i < current ? "bg-white" : "bg-white/20"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-sm font-bold text-white/60">
        {current} / {total}
      </p>
    </div>
  );
}
