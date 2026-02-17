"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { useRoom } from "@/hooks/useRoom";
import { useRoomActions } from "@/hooks/useRoomActions";
import HostLobby from "@/components/multiplayer/HostLobby";
import PlayerLobby from "@/components/multiplayer/PlayerLobby";
import HostQuestion from "@/components/multiplayer/HostQuestion";
import PlayerQuestion from "@/components/multiplayer/PlayerQuestion";
import HostResults from "@/components/multiplayer/HostResults";
import PlayerResults from "@/components/multiplayer/PlayerResults";
import Leaderboard from "@/components/multiplayer/Leaderboard";
import WagerScreen from "@/components/multiplayer/WagerScreen";
import HostWager from "@/components/multiplayer/HostWager";
import type { PowerUpType } from "@/lib/multiplayer/types";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function GamePage({ params }: PageProps) {
  const { code } = use(params);
  const router = useRouter();

  const [playerId] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("quiz-player-id") ?? "";
  });

  const [hostId] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("quiz-host-id") ?? "";
  });

  const [playerName] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("quiz-player-name") ?? "";
  });

  const [playerEmoji] = useState(() => {
    if (typeof window === "undefined") return "🎭";
    return sessionStorage.getItem("quiz-player-emoji") ?? "🎭";
  });

  const isHost = !!hostId && hostId === playerId;

  const {
    state,
    players,
    question,
    results,
    leaderboard,
    answerCount,
    reactions,
    connected,
    error: roomError,
    gameMode,
    teamNames,
    wager,
    timerReduction,
    powerUpEvent,
    eliminatedEvent,
  } = useRoom(code, playerId);

  const { startGame, submitAnswer, nextQuestion, sendReaction, usePowerUp, submitWager } = useRoomActions();

  // Current player info
  const currentPlayer = useMemo(
    () => players.find((p) => p.id === playerId),
    [players, playerId]
  );

  // Store the last question for showing during results (host needs the options)
  const [lastQuestion, setLastQuestion] = useState(question);
  useEffect(() => {
    if (question) setLastQuestion(question);
  }, [question]);

  const handleStart = useCallback(async () => {
    try {
      await startGame(code, hostId);
    } catch (e) {
      console.error("Failed to start:", e);
    }
  }, [code, hostId, startGame]);

  const handleAnswer = useCallback(
    async (index: number) => {
      try {
        await submitAnswer(code, playerId, index);
      } catch (e) {
        console.error("Failed to submit:", e);
      }
    },
    [code, playerId, submitAnswer]
  );

  const handleNext = useCallback(async () => {
    try {
      await nextQuestion(code, hostId);
    } catch (e) {
      console.error("Failed to advance:", e);
    }
  }, [code, hostId, nextQuestion]);

  const handleReact = useCallback(
    async (emoji: string) => {
      try {
        await sendReaction(code, playerId, emoji);
      } catch (e) {
        console.error("Failed to react:", e);
      }
    },
    [code, playerId, sendReaction]
  );

  const handlePowerUp = useCallback(
    async (powerUp: PowerUpType) => {
      try {
        await usePowerUp(code, playerId, powerUp);
      } catch (e) {
        console.error("Failed to use power-up:", e);
      }
    },
    [code, playerId, usePowerUp]
  );

  const handleWager = useCallback(
    async (amount: number) => {
      try {
        await submitWager(code, playerId, amount);
      } catch (e) {
        console.error("Failed to submit wager:", e);
      }
    },
    [code, playerId, submitWager]
  );

  const handleAdvanceFromWager = useCallback(async () => {
    try {
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance-wager", code, hostId }),
      });
    } catch (e) {
      console.error("Failed to advance from wager:", e);
    }
  }, [code, hostId]);

  const handleExit = useCallback(() => {
    try {
      fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", code, playerId }),
      });
    } catch {}
    router.push("/play");
  }, [code, playerId, router]);

  const handleTimerExpire = useCallback(async () => {
    if (!isHost) return;
    try {
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "force-results", code, hostId }),
      });
    } catch (e) {
      console.error("Failed to force results:", e);
    }
  }, [isHost, code, hostId]);

  // Determine if player can answer (team mode)
  const canAnswer = useMemo(() => {
    if (gameMode !== "team" || !question?.currentTeamAnswerers) return true;
    return question.currentTeamAnswerers.includes(playerId);
  }, [gameMode, question, playerId]);

  // Find the team answerer name for "waiting" display
  const waitingPlayerName = useMemo(() => {
    if (canAnswer || gameMode !== "team" || !question?.currentTeamAnswerers) return undefined;
    const answererId = question.currentTeamAnswerers.find((id) => {
      const p = players.find((pl) => pl.id === id);
      return p?.teamIndex === currentPlayer?.teamIndex;
    });
    if (!answererId) return undefined;
    return players.find((p) => p.id === answererId)?.name;
  }, [canAnswer, gameMode, question, players, currentPlayer, playerId]);

  // Error state — room not found or connection failed permanently
  if (roomError) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0f0e0a]">
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <div className="text-5xl">😵</div>
          <p className="text-lg text-red-300">{roomError}</p>
          <button
            onClick={() => router.push("/play")}
            className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-amber-950 hover:bg-amber-400"
          >
            Grįžti
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!state) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0f0e0a]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
          <p className="text-amber-200/50">
            {connected ? "Kraunama..." : "Jungiamasi..."}
          </p>
        </div>
      </div>
    );
  }

  const totalQuestions = question?.total ?? lastQuestion?.total ?? 15;
  const currentIndex = question?.index ?? lastQuestion?.index ?? 0;
  const isLastQuestion = currentIndex + 1 >= totalQuestions;

  return (
    <div className="relative flex min-h-svh flex-col bg-[#0f0e0a]">
      {/* Decorative gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-red-500/[0.05] blur-3xl" />
        <div className="absolute left-0 top-1/2 h-[300px] w-[300px] rounded-full bg-emerald-500/[0.04] blur-3xl" />
      </div>

      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-amber-200/60 transition-colors hover:bg-white/20 hover:text-amber-100"
        title="Išeiti"
      >
        <X className="h-5 w-5" />
      </button>

      <main className="relative z-10 mx-auto flex w-[92%] max-w-5xl flex-1 flex-col px-4 py-6 sm:px-8">
        {/* --- LOBBY --- */}
        {state === "lobby" && isHost && (
          <HostLobby
            code={code}
            players={players}
            onStart={handleStart}
            gameMode={gameMode}
            teamNames={teamNames}
          />
        )}

        {state === "lobby" && !isHost && (
          <PlayerLobby code={code} players={players} playerName={playerName} playerEmoji={playerEmoji} />
        )}

        {/* --- WAGER --- */}
        {state === "wager" && isHost && (
          <HostWager
            players={players}
            onAdvance={handleAdvanceFromWager}
          />
        )}

        {state === "wager" && !isHost && (
          <WagerScreen
            currentScore={currentPlayer?.score ?? 0}
            onSubmit={handleWager}
          />
        )}

        {/* --- QUESTION --- */}
        {state === "question" && question && isHost && (
          <HostQuestion
            question={question}
            answerCount={answerCount}
            onTimerExpire={handleTimerExpire}
            powerUpEvent={powerUpEvent}
          />
        )}

        {state === "question" && question && !isHost && (
          <PlayerQuestion
            question={question}
            onAnswer={handleAnswer}
            onTimerExpire={handleTimerExpire}
            timerReduction={timerReduction}
            powerUpUses={currentPlayer?.powerUpUses ?? 0}
            onUsePowerUp={handlePowerUp}
            eliminated={currentPlayer?.eliminated ?? false}
            canAnswer={canAnswer}
            waitingPlayerName={waitingPlayerName}
          />
        )}

        {/* --- RESULTS --- */}
        {state === "results" && results && isHost && (
          <HostResults
            question={lastQuestion}
            results={results}
            reactions={reactions}
            isLast={isLastQuestion}
            onNext={handleNext}
            gameMode={gameMode}
          />
        )}

        {state === "results" && results && !isHost && (
          <PlayerResults playerId={playerId} results={results} onReact={handleReact} />
        )}

        {/* --- FINISHED --- */}
        {state === "finished" && leaderboard && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <Leaderboard
              leaderboard={leaderboard}
              currentPlayerId={isHost ? undefined : playerId}
            />
            <button
              onClick={() => router.push("/play")}
              className="mt-8 rounded-xl border-2 border-amber-400/30 bg-amber-400/5 px-6 py-3 font-semibold text-amber-100 transition-colors hover:border-amber-400/50 hover:bg-amber-400/10"
            >
              Žaisti dar kartą
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
