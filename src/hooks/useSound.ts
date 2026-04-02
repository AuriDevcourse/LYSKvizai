"use client";

import { useRef, useCallback, useEffect } from "react";

const SOUNDS = {
  lobby: "/sounds/Classical March.mp3",
} as const;

export function useSound() {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

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

  const playLobby = useCallback(() => {
    const audio = audioRefs.current.get("lobby");
    if (!audio) return;
    audio.loop = true;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  const stopLobby = useCallback(() => {
    const audio = audioRefs.current.get("lobby");
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  return { playLobby, stopLobby };
}
