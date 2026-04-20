"use client";

import { useCallback } from "react";
import type { GameMode } from "@/lib/multiplayer/types";
import { MP_API_URL } from "@/lib/multiplayer/config";

async function postAction(body: Record<string, unknown>) {
  const res = await fetch(`${MP_API_URL}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function useRoomActions() {
  const createRoom = useCallback(
    async (
      hostId: string,
      quizIds: string | string[],
      questionCount?: number,
      timerDuration?: number,
      gameMode?: GameMode,
      teamCount?: number,
      eliminationInterval?: number
    ) => {
      const ids = Array.isArray(quizIds) ? quizIds : [quizIds];
      return postAction({
        action: "create",
        hostId,
        quizIds: ids,
        questionCount,
        timerDuration,
        gameMode,
        teamCount,
        eliminationInterval,
      }) as Promise<{ code: string; hostToken: string }>;
    },
    []
  );

  const joinRoom = useCallback(
    async (code: string, playerId: string, name: string, emoji: string, token?: string) => {
      return postAction({ action: "join", code: code.toUpperCase(), playerId, name, emoji, token }) as Promise<{
        playerToken: string;
      }>;
    },
    []
  );

  const startGame = useCallback(async (code: string, hostId: string, hostToken: string) => {
    return postAction({ action: "start", code, hostId, hostToken });
  }, []);

  const submitAnswer = useCallback(
    async (code: string, playerId: string, token: string, answerIndex: number) => {
      return postAction({ action: "answer", code, playerId, token, answerIndex });
    },
    []
  );

  const nextQuestion = useCallback(async (code: string, hostId: string, hostToken: string) => {
    return postAction({ action: "next", code, hostId, hostToken });
  }, []);

  const forceResults = useCallback(async (code: string, hostId: string, hostToken: string) => {
    return postAction({ action: "force-results", code, hostId, hostToken });
  }, []);

  const sendReaction = useCallback(
    async (code: string, playerId: string, token: string, emoji: string) => {
      return postAction({ action: "react", code, playerId, token, emoji });
    },
    []
  );

  const submitWager = useCallback(
    async (code: string, playerId: string, token: string, amount: number) => {
      return postAction({ action: "submit-wager", code, playerId, token, amount });
    },
    []
  );

  return {
    createRoom, joinRoom, startGame, submitAnswer, nextQuestion,
    forceResults, sendReaction, submitWager,
  };
}
