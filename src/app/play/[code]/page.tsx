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
import FastestFingerInput from "@/components/multiplayer/FastestFingerInput";
import YearGuesserInput from "@/components/multiplayer/YearGuesserInput";
import HostResults from "@/components/multiplayer/HostResults";
import PlayerResults from "@/components/multiplayer/PlayerResults";
import Leaderboard from "@/components/multiplayer/Leaderboard";
import WagerScreen from "@/components/multiplayer/WagerScreen";
import HostWager from "@/components/multiplayer/HostWager";
import type { PowerUpType } from "@/lib/multiplayer/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { preTranslateContent } from "@/hooks/useContentTranslation";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function GamePage({ params }: PageProps) {
  const { code } = use(params);
  const router = useRouter();
  const { t, lang } = useTranslation();

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

  const [hostPlaying] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("quiz-host-playing") === "true";
  });

  const isHost = !!hostId && hostId === playerId;
  const isHostPlayer = isHost && hostPlaying;

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

  const currentPlayer = useMemo(
    () => players.find((p) => p.id === playerId),
    [players, playerId]
  );

  const [lastQuestion, setLastQuestion] = useState(question);
  useEffect(() => {
    if (question) setLastQuestion(question);
  }, [question]);

  // Pre-translate question content as soon as it arrives
  useEffect(() => {
    if (!question || lang === "lt") return;
    const texts = [question.question, ...question.options];
    preTranslateContent(texts, lang);
  }, [question, lang]);

  // Pre-translate results content
  useEffect(() => {
    if (!results || lang === "lt") return;
    const texts: string[] = [];
    if (results.correctAnswerText) texts.push(results.correctAnswerText);
    if (results.explanation) texts.push(results.explanation);
    // Also translate the options from the last question
    if (lastQuestion) texts.push(...lastQuestion.options);
    preTranslateContent(texts, lang);
  }, [results, lang, lastQuestion]);

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

  const handleYearAnswer = useCallback(
    async (year: number) => {
      if (!playerId) return;
      try {
        await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "answer-year", code, playerId, year }),
        });
      } catch (e) {
        console.error("Failed to submit year answer:", e);
      }
    },
    [code, playerId]
  );

  const handleTextAnswer = useCallback(
    async (text: string) => {
      if (!playerId) return;
      try {
        await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "answer-text", code, playerId, answer: text }),
        });
      } catch (e) {
        console.error("Failed to submit text answer:", e);
      }
    },
    [code, playerId]
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

  const canAnswer = useMemo(() => {
    if (gameMode !== "team" || !question?.currentTeamAnswerers) return true;
    return question.currentTeamAnswerers.includes(playerId);
  }, [gameMode, question, playerId]);

  const waitingPlayerName = useMemo(() => {
    if (canAnswer || gameMode !== "team" || !question?.currentTeamAnswerers) return undefined;
    const answererId = question.currentTeamAnswerers.find((id) => {
      const p = players.find((pl) => pl.id === id);
      return p?.teamIndex === currentPlayer?.teamIndex;
    });
    if (!answererId) return undefined;
    return players.find((p) => p.id === answererId)?.name;
  }, [canAnswer, gameMode, question, players, currentPlayer, playerId]);

  if (roomError) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#46178f]">
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <p className="text-lg font-bold text-white">{roomError}</p>
          <button
            onClick={() => router.push("/play")}
            className="btn-primary"
          >
            {t("nav.back")}
          </button>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#46178f]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
          <p className="font-bold text-white/50">
            {connected ? t("game.loading") : t("game.connecting")}
          </p>
        </div>
      </div>
    );
  }

  const totalQuestions = question?.total ?? lastQuestion?.total ?? 15;
  const currentIndex = question?.index ?? lastQuestion?.index ?? 0;
  const isLastQuestion = currentIndex + 1 >= totalQuestions;

  return (
    <div className="relative flex min-h-svh flex-col bg-[#46178f] bg-pattern">
      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
        title="Exit"
      >
        <X className="h-5 w-5" />
      </button>

      <main className="relative z-10 mx-auto flex w-[92%] max-w-5xl flex-1 flex-col px-4 py-6 sm:px-8">
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

        {state === "wager" && isHost && !isHostPlayer && (
          <HostWager
            players={players}
            onAdvance={handleAdvanceFromWager}
          />
        )}

        {state === "wager" && isHost && isHostPlayer && (
          <WagerScreen
            currentScore={currentPlayer?.score ?? 0}
            onSubmit={handleWager}
          />
        )}

        {state === "wager" && !isHost && (
          <WagerScreen
            currentScore={currentPlayer?.score ?? 0}
            onSubmit={handleWager}
          />
        )}

        {state === "question" && question && isHost && !isHostPlayer && (
          <HostQuestion
            question={question}
            answerCount={answerCount}
            onTimerExpire={handleTimerExpire}
            powerUpEvent={powerUpEvent}
          />
        )}

        {state === "question" && question && isHost && isHostPlayer && (
          question.type === "fastest-finger" ? (
            <FastestFingerInput
              question={question}
              onAnswer={handleTextAnswer}
              onTimerExpire={handleTimerExpire}
              timerReduction={timerReduction}
              eliminated={currentPlayer?.eliminated ?? false}
            />
          ) : question.type === "year-guesser" ? (
            <YearGuesserInput
              question={question}
              onAnswer={handleYearAnswer}
              onTimerExpire={handleTimerExpire}
              timerReduction={timerReduction}
              eliminated={currentPlayer?.eliminated ?? false}
            />
          ) : (
            <PlayerQuestion
              question={question}
              onAnswer={handleAnswer}
              onTimerExpire={handleTimerExpire}
              timerReduction={timerReduction}
              powerUpUses={currentPlayer?.powerUpUses ?? 0}
              usedPowerUpTypes={currentPlayer?.usedPowerUpTypes ?? []}
              onUsePowerUp={handlePowerUp}
              eliminated={currentPlayer?.eliminated ?? false}
              canAnswer={canAnswer}
              waitingPlayerName={waitingPlayerName}
            />
          )
        )}

        {state === "question" && question && !isHost && (
          question.type === "fastest-finger" ? (
            <FastestFingerInput
              question={question}
              onAnswer={handleTextAnswer}
              onTimerExpire={handleTimerExpire}
              timerReduction={timerReduction}
              eliminated={currentPlayer?.eliminated ?? false}
            />
          ) : question.type === "year-guesser" ? (
            <YearGuesserInput
              question={question}
              onAnswer={handleYearAnswer}
              onTimerExpire={handleTimerExpire}
              timerReduction={timerReduction}
              eliminated={currentPlayer?.eliminated ?? false}
            />
          ) : (
            <PlayerQuestion
              question={question}
              onAnswer={handleAnswer}
              onTimerExpire={handleTimerExpire}
              timerReduction={timerReduction}
              powerUpUses={currentPlayer?.powerUpUses ?? 0}
              usedPowerUpTypes={currentPlayer?.usedPowerUpTypes ?? []}
              onUsePowerUp={handlePowerUp}
              eliminated={currentPlayer?.eliminated ?? false}
              canAnswer={canAnswer}
              waitingPlayerName={waitingPlayerName}
            />
          )
        )}

        {state === "results" && results && isHost && !isHostPlayer && (
          <HostResults
            question={lastQuestion}
            results={results}
            reactions={reactions}
            isLast={isLastQuestion}
            onNext={handleNext}
            gameMode={gameMode}
          />
        )}

        {state === "results" && results && isHost && isHostPlayer && (
          <PlayerResults playerId={playerId} results={results} onReact={handleReact}>
            <button
              onClick={handleNext}
              className="btn-primary flex items-center justify-center gap-2 w-full text-lg mt-4"
            >
              {isLastQuestion ? t("game.results") : t("game.nextQuestion")}
            </button>
          </PlayerResults>
        )}

        {state === "results" && results && !isHost && (
          <PlayerResults playerId={playerId} results={results} onReact={handleReact} />
        )}

        {state === "finished" && leaderboard && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <Leaderboard
              leaderboard={leaderboard}
              currentPlayerId={isHost ? undefined : playerId}
            />
            <button
              onClick={() => router.push("/play")}
              className="btn-secondary mt-8"
            >
              {t("game.playAgain")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
