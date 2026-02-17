"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  autoplay?: boolean;
}

export default function AudioPlayer({ src, autoplay = true }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (autoplay && audioRef.current) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [autoplay, src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 rounded-xl border-2 border-cyan-400/30 bg-cyan-400/10 px-6 py-4">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={togglePlay}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-white transition-colors hover:bg-cyan-400"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
      </button>
      <div className="flex items-center gap-2">
        <Volume2 className="h-5 w-5 text-cyan-300" />
        {/* Waveform animation */}
        <div className="flex items-center gap-0.5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full bg-cyan-400 ${playing ? "animate-pulse" : ""}`}
              style={{
                height: playing ? `${12 + Math.sin(i * 0.8) * 8}px` : "4px",
                animationDelay: `${i * 0.1}s`,
                transition: "height 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
      <span className="text-sm font-medium text-cyan-200">Audio klausimas</span>
    </div>
  );
}
