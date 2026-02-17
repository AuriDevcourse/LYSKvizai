"use client";

import { useRef, useCallback, useEffect } from "react";

const SOUNDS = {
  correct: "/sounds/Correct Answer.mp3",
  wrong: "/sounds/Wrong.wav",
  lobby: "/sounds/Classical March.mp3",
} as const;

export function useSound() {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const mutedRef = useRef(false);

  // Preload all sounds on mount
  useEffect(() => {
    for (const [key, src] of Object.entries(SOUNDS)) {
      const audio = new Audio(src);
      audio.preload = "auto";
      audioRefs.current.set(key, audio);
    }
    return () => {
      for (const audio of audioRefs.current.values()) {
        audio.pause();
        audio.src = "";
      }
      audioRefs.current.clear();
    };
  }, []);

  const play = useCallback((name: keyof typeof SOUNDS, loop = false) => {
    if (mutedRef.current) return;
    const audio = audioRefs.current.get(name);
    if (!audio) return;
    audio.loop = loop;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  const stop = useCallback((name: keyof typeof SOUNDS) => {
    const audio = audioRefs.current.get(name);
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const playCorrect = useCallback(() => play("correct"), [play]);
  const playWrong = useCallback(() => play("wrong"), [play]);
  const playLobby = useCallback(() => play("lobby", true), [play]);
  const stopLobby = useCallback(() => stop("lobby"), [stop]);

  return { playCorrect, playWrong, playLobby, stopLobby };
}
