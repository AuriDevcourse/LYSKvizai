"use client";

import { useRef, useCallback, useEffect } from "react";

const SOUNDS = {
  lobby: "/sounds/Classical March.mp3",
} as const;

type SoundKey = keyof typeof SOUNDS;

/**
 * Lobby audio, loaded only if it's actually going to be heard.
 *
 * This used to build an `Audio` element for every sound on mount with
 * `preload = "auto"`, which fetched a **5.3 MB** MP3 the instant the host
 * lobby rendered. The lobby starts muted, so the normal session paid for the
 * entire file over whatever wifi the venue had and never played a note of it —
 * while the same connection was trying to serve the join page to thirty
 * phones.
 *
 * Now nothing is requested until `playLobby` is called, which only happens on
 * a deliberate tap of the unmute button.
 */
export function useSound() {
  const audioRefs = useRef<Map<SoundKey, HTMLAudioElement>>(new Map());

  /** Creates the element on first use. `preload="none"` keeps it at zero bytes until played. */
  const getAudio = useCallback((key: SoundKey): HTMLAudioElement => {
    const existing = audioRefs.current.get(key);
    if (existing) return existing;
    const audio = new Audio(SOUNDS[key]);
    audio.preload = "none";
    audioRefs.current.set(key, audio);
    return audio;
  }, []);

  useEffect(() => {
    // Capture the Map this effect owns. Reading `audioRefs.current` from the
    // cleanup closure is the classic stale-ref bug: by teardown it may point at
    // a different Map, and anything already playing would keep playing with
    // nothing left holding a reference to stop it.
    const sounds = audioRefs.current;
    return () => {
      for (const audio of sounds.values()) {
        audio.pause();
        // Dropping the src is what actually cancels an in-flight download.
        audio.src = "";
      }
      sounds.clear();
    };
  }, []);

  const playLobby = useCallback(() => {
    const audio = getAudio("lobby");
    audio.loop = true;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [getAudio]);

  const stopLobby = useCallback(() => {
    // Deliberately does not call `getAudio`: stopping a sound that was never
    // started should not be the thing that creates it.
    const audio = audioRefs.current.get("lobby");
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  return { playLobby, stopLobby };
}
