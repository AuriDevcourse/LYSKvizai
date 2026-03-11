"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type {
  RoomSnapshot,
  QuestionPayload,
  ResultsPayload,
  LeaderboardEntry,
  PlayerInfo,
  RoomState,
  EmojiReaction,
  GameMode,
  PowerUpUsedPayload,
  WagerPayload,
} from "@/lib/multiplayer/types";
import { MP_WS_URL } from "@/lib/multiplayer/config";

export interface EmojiReactionWithId extends EmojiReaction {
  id: string;
}

interface UseRoomReturn {
  state: RoomState | null;
  players: PlayerInfo[];
  question: QuestionPayload | null;
  results: ResultsPayload | null;
  leaderboard: LeaderboardEntry[] | null;
  answerCount: { count: number; total: number } | null;
  reactions: EmojiReactionWithId[];
  connected: boolean;
  error: string | null;
  gameMode: GameMode;
  teamNames: string[];
  wager: WagerPayload | null;
  timerReduction: number;
  powerUpEvent: PowerUpUsedPayload | null;
  eliminatedEvent: { playerId: string; playerName: string; playerEmoji: string } | null;
}

const MAX_RETRIES = 5;

export function useRoom(code: string | null, playerId: string | null): UseRoomReturn {
  const [state, setState] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [answerCount, setAnswerCount] = useState<{ count: number; total: number } | null>(null);
  const [reactions, setReactions] = useState<EmojiReactionWithId[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [wager, setWager] = useState<WagerPayload | null>(null);
  const [timerReduction, setTimerReduction] = useState(0);
  const [powerUpEvent, setPowerUpEvent] = useState<PowerUpUsedPayload | null>(null);
  const [eliminatedEvent, setEliminatedEvent] = useState<{ playerId: string; playerName: string; playerEmoji: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retriesRef = useRef(0);
  const reactionIdRef = useRef(0);

  const connect = useCallback(() => {
    if (!code || !playerId) return;

    /** Adjust startTime using serverNow to correct for clock skew between devices */
    function adjustQuestion(q: QuestionPayload | undefined): QuestionPayload | null {
      if (!q) return null;
      const clockOffset = Date.now() - q.serverNow;
      return { ...q, startTime: q.startTime + clockOffset };
    }

    const url = `${MP_WS_URL}/ws/${code.toUpperCase()}?playerId=${playerId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      retriesRef.current = 0;
    };

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data);

      switch (event.type) {
        case "room-state": {
          const snapshot: RoomSnapshot = event.data;
          setState(snapshot.state);
          setPlayers(snapshot.players);
          setQuestion(adjustQuestion(snapshot.question));
          setResults(snapshot.results ?? null);
          setLeaderboard(snapshot.leaderboard ?? null);
          setAnswerCount(null);
          setGameMode(snapshot.gameMode ?? "classic");
          setTeamNames(snapshot.teamNames ?? []);
          setWager(snapshot.wager ?? null);
          setConnected(true);
          setError(null);
          retriesRef.current = 0;
          break;
        }
        case "player-joined": {
          const { player } = event.data;
          setPlayers((prev) => {
            const existing = prev.findIndex((p) => p.id === player.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = player;
              return updated;
            }
            return [...prev, player];
          });
          break;
        }
        case "player-left": {
          const { playerId: leftId } = event.data;
          setPlayers((prev) =>
            prev.map((p) => (p.id === leftId ? { ...p, connected: false } : p))
          );
          break;
        }
        case "question-start": {
          const payload: QuestionPayload = event.data;
          setState("question");
          setQuestion(adjustQuestion(payload));
          setResults(null);
          setAnswerCount(null);
          setTimerReduction(0);
          break;
        }
        case "answer-count":
          setAnswerCount(event.data);
          break;
        case "results": {
          const payload: ResultsPayload = event.data;
          setState("results");
          setResults(payload);
          setQuestion(null);
          setWager(null);
          setPlayers((prev) =>
            prev.map((p) => {
              const entry = payload.leaderboard.find((l) => l.playerId === p.id);
              const eliminated = payload.eliminatedThisRound?.find((el) => el.playerId === p.id);
              return {
                ...p,
                score: entry?.score ?? p.score,
                eliminated: eliminated ? true : p.eliminated,
              };
            })
          );
          break;
        }
        case "finished": {
          const { leaderboard: lb } = event.data;
          setState("finished");
          setLeaderboard(lb);
          setResults(null);
          setQuestion(null);
          break;
        }
        case "emoji-reaction": {
          const data: EmojiReaction = event.data;
          const id = `r_${++reactionIdRef.current}`;
          setReactions((prev) => [...prev, { ...data, id }]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== id));
          }, 3000);
          break;
        }
        case "powerup-used": {
          const data: PowerUpUsedPayload = event.data;
          setPowerUpEvent(data);
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === data.playerId
                ? {
                    ...p,
                    powerUpUses: Math.max(0, (p.powerUpUses ?? 0) - 1),
                    usedPowerUpTypes: [...(p.usedPowerUpTypes ?? []), data.powerUp],
                  }
                : p
            )
          );
          setTimeout(() => setPowerUpEvent(null), 3000);
          break;
        }
        case "wager-start": {
          const data: WagerPayload = event.data;
          setState("wager");
          setWager(data);
          setQuestion(null);
          break;
        }
        case "player-eliminated": {
          const data = event.data;
          setEliminatedEvent(data);
          setPlayers((prev) =>
            prev.map((p) => (p.id === data.playerId ? { ...p, eliminated: true } : p))
          );
          setTimeout(() => setEliminatedEvent(null), 5000);
          break;
        }
        case "timer-reduced": {
          setTimerReduction((prev) => prev + event.data.seconds);
          break;
        }
        case "ping":
          // keep-alive, ignore
          break;
      }
    };

    ws.onclose = () => {
      setConnected(false);

      retriesRef.current++;
      if (retriesRef.current >= MAX_RETRIES) {
        setError("Room not found or connection lost. Go back to /play and try again.");
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, retriesRef.current - 1), 8000);
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = () => {
      // onclose will fire after this, handling reconnection
    };
  }, [code, playerId]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    state, players, question, results, leaderboard, answerCount, reactions,
    connected, error, gameMode, teamNames, wager, timerReduction,
    powerUpEvent, eliminatedEvent,
  };
}
