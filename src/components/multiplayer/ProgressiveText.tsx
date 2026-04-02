"use client";

interface ProgressiveTextProps {
  text: string;
  visibleWordCount: number;
  className?: string;
}

export default function ProgressiveText({ text, visibleWordCount, className }: ProgressiveTextProps) {
  const words = text.split(/\s+/);

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 && " "}
          <span
            className={`inline-block transition-opacity duration-300 ${
              i < visibleWordCount ? "opacity-100" : "opacity-0"
            }`}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}
