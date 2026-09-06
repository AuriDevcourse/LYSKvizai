"use client";

import { useRef, useCallback, useEffect } from "react";

const SOUNDS = {
  lobby: "/sounds/Classical March.mp3",
} as const;

export function useSound() {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    // Capture the Map this effect populated. Reading `audioRefs.current` from
    // the cleanup closure is the classic stale-ref bug: by teardown it may point
    // at a different Map, and the audio elements this effect created would keep
    // playing with nothing left holding a reference to stop them.
    const sounds = audioRefs.current;
    for (const [key, src] of Object.entries(SOUNDS)) {
      const audio = new Audio(src);
      audio.preload = "auto";
      sounds.set(key, audio);
    }
    return () => {
      for (const audio of sounds.values()) {
        audio.pause();
        audio.src = "";
      }
      sounds.clear();
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
