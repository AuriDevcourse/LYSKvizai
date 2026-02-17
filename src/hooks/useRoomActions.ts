"use client";

import { useCallback } from "react";
import type { GameMode, PowerUpType } from "@/lib/multiplayer/types";

async function postAction(body: Record<string, unknown>) {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Klaida");
  return data;
}

export function useRoomActions() {
  const createRoom = useCallback(
    async (
      hostId: string,
      quizId: string,
      questionCount?: number,
      timerDuration?: number,
      gameMode?: GameMode,
      teamCount?: number,
      eliminationInterval?: number
    ) => {
      return postAction({
        action: "create",
        hostId,
        quizId,
        questionCount,
        timerDuration,
        gameMode,
        teamCount,
        eliminationInterval,
      }) as Promise<{ code: string }>;
    },
    []
  );

  const joinRoom = useCallback(async (code: string, playerId: string, name: string, emoji: string) => {
    return postAction({ action: "join", code: code.toUpperCase(), playerId, name, emoji });
  }, []);

  const startGame = useCallback(async (code: string, hostId: string) => {
    return postAction({ action: "start", code, hostId });
  }, []);

  const submitAnswer = useCallback(
    async (code: string, playerId: string, answerIndex: number) => {
      return postAction({ action: "answer", code, playerId, answerIndex });
    },
    []
  );

  const nextQuestion = useCallback(async (code: string, hostId: string) => {
    return postAction({ action: "next", code, hostId });
  }, []);

  const forceResults = useCallback(async (code: string, hostId: string) => {
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "force-results", code, hostId }),
    });
    return res.json();
  }, []);

  const sendReaction = useCallback(
    async (code: string, playerId: string, emoji: string) => {
      return postAction({ action: "react", code, playerId, emoji });
    },
    []
  );

  const usePowerUp = useCallback(
    async (code: string, playerId: string, powerUp: PowerUpType) => {
      return postAction({ action: "use-powerup", code, playerId, powerUp });
    },
    []
  );

  const submitWager = useCallback(
    async (code: string, playerId: string, amount: number) => {
      return postAction({ action: "submit-wager", code, playerId, amount });
    },
    []
  );

  return {
    createRoom, joinRoom, startGame, submitAnswer, nextQuestion,
    forceResults, sendReaction, usePowerUp, submitWager,
  };
}
