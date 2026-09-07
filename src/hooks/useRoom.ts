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
import { MP_API_URL, MP_SSE_URL, SSE_SUFFIX } from "@/lib/multiplayer/config";

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
  /**
   * How many questions the game has, straight from the room snapshot.
   *
   * This was in every snapshot and never read, so callers guessed: the play
   * page fell back to a hardcoded 15, which is wrong for any other length and
   * is the only number available in the lobby, before a question exists.
   */
  totalQuestions: number;
  wager: WagerPayload | null;
  timerReduction: number;
  powerUpEvent: null;
  eliminatedEvent: { playerId: string; playerName: string; playerEmoji: string } | null;
  playerLeftEvent: { playerId: string; playerName: string; playerEmoji: string } | null;
  /** This player's current answer streak, for the live badge on their phone. */
  myStreak: number;
}

/**
 * Reconnection never gives up entirely.
 *
 * It used to stop dead after 200 attempts or three minutes, and nothing
 * rescheduled — so a phone that locked during a long question came back to a
 * permanently broken screen even though the room was still running and the
 * grace timer had not necessarily expired. The visibility/online listeners
 * could revive it, but only if the user happened to switch away and back.
 *
 * Now the fast backoff is bounded, and past that point it keeps trying on a
 * slow steady interval — cheap enough to run indefinitely, and the only thing
 * that can recover a phone left face-down.
 */
const FAST_RETRIES = 20;
const SLOW_RETRY_MS = 15_000;

/**
 * @param token The caller's session token — a player token, or the host token
 *   when the host is driving the big screen. The stream is membership-gated, so
 *   without it the server returns 403.
 */
export function useRoom(code: string | null, playerId: string | null, token = ""): UseRoomReturn {
  const [state, setState] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  /** This player's answer streak, latched across rounds. `results` is cleared
   *  on every question-start, so the question screen has nothing to read from
   *  unless we hold onto it here. */
  const [myStreak, setMyStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [answerCount, setAnswerCount] = useState<{ count: number; total: number } | null>(null);
  const [reactions, setReactions] = useState<EmojiReactionWithId[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [wager, setWager] = useState<WagerPayload | null>(null);
  const [timerReduction, setTimerReduction] = useState(0);
  const [powerUpEvent] = useState<null>(null);
  const [eliminatedEvent, setEliminatedEvent] = useState<{ playerId: string; playerName: string; playerEmoji: string } | null>(null);
  const [playerLeftEvent, setPlayerLeftEvent] = useState<{ playerId: string; playerName: string; playerEmoji: string } | null>(null);
  const leftClearTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retriesRef = useRef(0);
  const reactionIdRef = useRef(0);
  const connectRef = useRef<() => void>(undefined);

  const connect = useCallback(() => {
    if (!code || !playerId) return;

    /** Adjust startTime using serverNow to correct for clock skew between devices */
    function adjustQuestion(q: QuestionPayload | undefined): QuestionPayload | null {
      if (!q) return null;
      const clockOffset = Date.now() - q.serverNow;
      return { ...q, startTime: q.startTime + clockOffset };
    }

    const url = `${MP_SSE_URL}/${code.toUpperCase()}${SSE_SUFFIX}`
      + `?playerId=${encodeURIComponent(playerId)}&token=${encodeURIComponent(token)}`;
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
      setTotalQuestions(snapshot.totalQuestions ?? 0);
      // Rebuild the freeze from state, not from the event we may have missed.
      setTimerReduction(snapshot.timerReduction ?? 0);
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
      setPlayers((prev) => {
        const leaver = prev.find((p) => p.id === leftId);
        if (leaver && leaver.connected) {
          // Skip the toast for players already marked disconnected (prevents duplicate
          // popups when the same event arrives via reconnect snapshot + stream).
          setPlayerLeftEvent({
            playerId: leaver.id,
            playerName: leaver.name,
            playerEmoji: leaver.emoji,
          });
          clearTimeout(leftClearTimer.current);
          leftClearTimer.current = setTimeout(() => setPlayerLeftEvent(null), 4000);
        }
        return prev.map((p) => (p.id === leftId ? { ...p, connected: false } : p));
      });
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
      const mine = payload.playerResults.find((r) => r.playerId === playerId);
      if (mine) setMyStreak(mine.streak);
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

    /**
     * Patch the two places power-up state is read, rather than replacing the
     * whole room. `roundPowerUps` drives the host's chips; `powerUpUsesLeft`
     * and `usedPowerUpTypes` are this player's own budget, so they're only
     * applied when the event is about them.
     */
    es.addEventListener("power-up-used", (e) => {
      const data = JSON.parse(e.data);
      setQuestion((prev) =>
        prev
          ? {
              ...prev,
              roundPowerUps: data.roundPowerUps,
              ...(data.playerId === playerId
                ? { powerUpUsesLeft: data.usesLeft, usedPowerUpTypes: data.usedTypes }
                : {}),
            }
          : prev
      );
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === data.playerId
            ? { ...p, powerUpUses: data.usesLeft, usedPowerUpTypes: data.usedTypes }
            : p
        )
      );
    });

    es.onopen = () => {
      setConnected(true);
      setError(null);
      retriesRef.current = 0;
      // Clear permanent disconnect timer on successful connection
    };

    es.onerror = () => {
      setConnected(false);
      es.close();

      retriesRef.current++;

      /*
       * Distinguish "the room is gone" from "the network blipped".
       *
       * `EventSource` exposes no status code, so a 404 for a reaped room and a
       * dropped wifi packet arrive as the identical `onerror` — and the client
       * would retry a room that no longer exists forever while telling the
       * player "connection lost". One cheap probe settles it: `GET /api/rooms`
       * answers 404 only when the room is really gone.
       */
      fetch(`${MP_API_URL}/rooms?code=${encodeURIComponent(code)}`)
        .then((r) => {
          if (r.status === 404) {
            setError("This game has ended.");
            clearTimeout(reconnectTimeout.current);
            return true;
          }
          return false;
        })
        .catch(() => false)
        .then((gone) => {
          if (gone) return;

          // Quick reconnect (a proxy may drop SSE after ~25s; that is normal).
          //
          // Jittered: when venue wifi blips, every phone starts the identical
          // deterministic backoff and retries in near-lockstep against one
          // small box — exactly when it is already absorbing the whole room's
          // reconnect wave. The random factor spreads them out.
          const fast = retriesRef.current <= FAST_RETRIES;
          const base = fast
            ? Math.min(500 * Math.pow(1.5, Math.min(retriesRef.current - 1, 5)), 4000)
            : SLOW_RETRY_MS;
          const delay = Math.round(base * (0.5 + Math.random()));
          reconnectTimeout.current = setTimeout(() => {
            connectRef.current?.();
          }, delay);
        });
    };
  }, [code, playerId, token]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      esRef.current?.close();
    };
  }, [connect]);

  // Force an immediate reconnect when the tab becomes visible again.
  // Mobile browsers suspend EventSource in the background; waiting for the
  // exponential backoff after waking up feels broken. pageshow fires on iOS
  // Safari bfcache restore where visibilitychange may not.
  useEffect(() => {
    if (!code || !playerId) return;
    const eager = () => {
      if (document.visibilityState !== "visible") return;
      const es = esRef.current;
      if (es && es.readyState === EventSource.OPEN) return;
      if (es) es.close();
      clearTimeout(reconnectTimeout.current);
      retriesRef.current = 0;
      connectRef.current?.();
    };
    document.addEventListener("visibilitychange", eager);
    window.addEventListener("pageshow", eager);
    window.addEventListener("online", eager);
    return () => {
      document.removeEventListener("visibilitychange", eager);
      window.removeEventListener("pageshow", eager);
      window.removeEventListener("online", eager);
    };
  }, [code, playerId, token]);

  return {
    state, players, question, results, leaderboard, answerCount, reactions,
    connected, error, gameMode, teamNames, totalQuestions, wager, timerReduction,
    powerUpEvent, eliminatedEvent, playerLeftEvent, myStreak,
  };
}
