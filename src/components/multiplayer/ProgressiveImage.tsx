"use client";

interface ProgressiveImageProps {
  src: string;
  blurAmount: number;
  className?: string;
}

export default function ProgressiveImage({ src, blurAmount, className }: ProgressiveImageProps) {
  return (
    <img
      src={src}
      // Names the picture without describing it — see the note on QuizImage.
      alt="Picture that this question is about, revealing gradually"
      className={className}
      style={{
        filter: `blur(${blurAmount}px)`,
        transition: "filter 0.3s ease-out",
      }}
    />
  );
}
