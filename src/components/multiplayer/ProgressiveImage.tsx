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
      alt=""
      className={className}
      style={{
        filter: `blur(${blurAmount}px)`,
        transition: "filter 0.3s ease-out",
      }}
    />
  );
}
