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
  WagerPayload,
} from "@/lib/multiplayer/types";
import { MP_SSE_URL } from "@/lib/multiplayer/config";

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
  powerUpEvent: null;
  eliminatedEvent: { playerId: string; playerName: string; playerEmoji: string } | null;
}

const MAX_RETRIES = 50; // Higher limit since Vercel may drop SSE every ~25s
const PERMANENT_DISCONNECT_TIMEOUT = 30_000; // 30s without connection = permanent disconnect

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
  const [powerUpEvent] = useState<null>(null);
  const [eliminatedEvent, setEliminatedEvent] = useState<{ playerId: string; playerName: string; playerEmoji: string } | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const disconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
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

    const url = `${MP_SSE_URL}/${code.toUpperCase()}?playerId=${playerId}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("room-state", (e) => {
      const snapshot: RoomSnapshot = JSON.parse(e.data);
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
    });

    es.addEventListener("player-joined", (e) => {
      const { player } = JSON.parse(e.data);
      setPlayers((prev) => {
        const existing = prev.findIndex((p) => p.id === player.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = player;
          return updated;
        }
        return [...prev, player];
      });
    });

    es.addEventListener("player-left", (e) => {
      const { playerId: leftId } = JSON.parse(e.data);
      setPlayers((prev) =>
        prev.map((p) => (p.id === leftId ? { ...p, connected: false } : p))
      );
    });

    es.addEventListener("question-start", (e) => {
      const payload: QuestionPayload = JSON.parse(e.data);
      setState("question");
      setQuestion(adjustQuestion(payload));
      setResults(null);
      setAnswerCount(null);
      setTimerReduction(0);
    });

    es.addEventListener("answer-count", (e) => {
      setAnswerCount(JSON.parse(e.data));
    });

    es.addEventListener("results", (e) => {
      const payload: ResultsPayload = JSON.parse(e.data);
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
    });

    es.addEventListener("finished", (e) => {
      const { leaderboard: lb } = JSON.parse(e.data);
      setState("finished");
      setLeaderboard(lb);
      setResults(null);
      setQuestion(null);
    });

    es.addEventListener("emoji-reaction", (e) => {
      const data: EmojiReaction = JSON.parse(e.data);
      const id = `r_${++reactionIdRef.current}`;
      setReactions((prev) => [...prev, { ...data, id }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    });

    es.addEventListener("wager-start", (e) => {
      const data: WagerPayload = JSON.parse(e.data);
      setState("wager");
      setWager(data);
      setQuestion(null);
    });

    es.addEventListener("player-eliminated", (e) => {
      const data = JSON.parse(e.data);
      setEliminatedEvent(data);
      setPlayers((prev) =>
        prev.map((p) => (p.id === data.playerId ? { ...p, eliminated: true } : p))
      );
      setTimeout(() => setEliminatedEvent(null), 5000);
    });

    es.addEventListener("timer-reduced", (e) => {
      const data = JSON.parse(e.data);
      setTimerReduction((prev) => prev + data.seconds);
    });

    es.onopen = () => {
      setConnected(true);
      setError(null);
      retriesRef.current = 0;
      // Clear permanent disconnect timer on successful connection
      if (disconnectTimer.current) {
        clearTimeout(disconnectTimer.current);
        disconnectTimer.current = undefined;
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();

      retriesRef.current++;
      if (retriesRef.current >= MAX_RETRIES) {
        setError("Connection lost permanently. Go back to /play and try again.");
        return;
      }

      // Start permanent disconnect timer on first failure
      if (!disconnectTimer.current) {
        disconnectTimer.current = setTimeout(() => {
          setError("Connection lost for too long. Go back to /play and try again.");
          clearTimeout(reconnectTimeout.current);
          esRef.current?.close();
        }, PERMANENT_DISCONNECT_TIMEOUT);
      }

      // Quick reconnect (Vercel may drop SSE after ~25s, this is expected)
      const delay = Math.min(500 * Math.pow(1.5, Math.min(retriesRef.current - 1, 5)), 4000);
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [code, playerId]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      clearTimeout(disconnectTimer.current);
      esRef.current?.close();
    };
  }, [connect]);

  return {
    state, players, question, results, leaderboard, answerCount, reactions,
    connected, error, gameMode, teamNames, wager, timerReduction,
    powerUpEvent, eliminatedEvent,
  };
}
