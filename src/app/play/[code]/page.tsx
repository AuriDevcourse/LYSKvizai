"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, AlertTriangle, WifiOff, ArrowRight, Trophy, Skull } from "lucide-react";
import { useRoom } from "@/hooks/useRoom";
import { useRoomActions } from "@/hooks/useRoomActions";
import Avatar from "@/components/Avatar";
import HostLobby from "@/components/multiplayer/HostLobby";
import PlayerLobby from "@/components/multiplayer/PlayerLobby";
import LiveRegion from "@/components/a11y/LiveRegion";
import HostQuestion from "@/components/multiplayer/HostQuestion";
import PlayerQuestion from "@/components/multiplayer/PlayerQuestion";
import FastestFingerInput from "@/components/multiplayer/FastestFingerInput";
import YearGuesserInput from "@/components/multiplayer/YearGuesserInput";
import HostResults from "@/components/multiplayer/HostResults";
import PlayerResults from "@/components/multiplayer/PlayerResults";
import Leaderboard from "@/components/multiplayer/Leaderboard";
import EmojiReactions from "@/components/multiplayer/EmojiReactions";
import WagerScreen from "@/components/multiplayer/WagerScreen";
import HostWager from "@/components/multiplayer/HostWager";
import { MP_API_URL } from "@/lib/multiplayer/config";
import type { QuestionPayload } from "@/lib/multiplayer/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function GamePage({ params }: PageProps) {
  const { code } = use(params);
  const router = useRouter();
  const { t } = useTranslation();

  const [playerId] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("quiz-player-id") ?? "";
  });

  const [hostId] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("quiz-host-id") ?? "";
  });

  const [hostToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("quiz-host-token") ?? "";
  });

  const [playerToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("quiz-player-token") ?? "";
  });

  const [playerName] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("quiz-player-name") ?? "";
  });

  const [playerEmoji] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("quiz-player-emoji") ?? "";
  });

  const [hostPlaying] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("quiz-host-playing") === "true";
  });

  // Verify host status against server on mount. Server returns { isHost: boolean }
  // and never exposes the stored hostId/hostToken.
  const [verifiedHost, setVerifiedHost] = useState(false);
  useEffect(() => {
    if (!hostId || !hostToken || hostId !== playerId) return;
    // Credentials in headers, not the query string — a token in a URL ends up
    // in proxy logs, browser history and `Referer`.
    fetch(`${MP_API_URL}/rooms?code=${encodeURIComponent(code)}`, {
      headers: { "x-host-id": hostId, "x-host-token": hostToken },
    })
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((data) => {
        if (data.isHost) {
          setVerifiedHost(true);
        } else {
          sessionStorage.removeItem("quiz-host-id");
          sessionStorage.removeItem("quiz-host-token");
          sessionStorage.removeItem("quiz-host-playing");
        }
      })
      .catch(() => {});
  }, [code, hostId, hostToken, playerId]);

  // Tell the server when the tab closes / backgrounds so ghost players don't
  // linger in the lobby. sendBeacon works during page unload (fetch doesn't).
  useEffect(() => {
    if (!playerId || !playerToken) return;
    const notifyDisconnect = () => {
      // `token` is required — disconnect is token-gated so a stranger with a
      // room code can't evict players. Without it the beacon is accepted by the
      // route and then silently dropped by the room store, and a clean exit
      // falls back to the 120s grace timer: the host's answer count waits on a
      // player who has already closed the tab.
      const payload = JSON.stringify({
        action: "disconnect",
        code,
        playerId,
        token: playerToken,
      });
      try {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(`${MP_API_URL}/rooms`, blob);
      } catch {
        // ignore — server will detect via SSE heartbeat within ~30s
      }
    };
    window.addEventListener("pagehide", notifyDisconnect);
    return () => window.removeEventListener("pagehide", notifyDisconnect);
  }, [code, playerId, playerToken]);

  const isHost = !!hostId && hostId === playerId && verifiedHost;
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
    totalQuestions: roomTotalQuestions,
    wager,
    timerReduction,
    eliminatedEvent,
    playerLeftEvent,
    myStreak,
  } = useRoom(code, playerId, playerToken || hostToken);

  const { startGame, submitAnswer, nextQuestion, sendReaction, submitWager, joinRoom } = useRoomActions();

  // Toast notification for action errors
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const currentPlayer = useMemo(
    () => players.find((p) => p.id === playerId),
    [players, playerId]
  );

  // Enrich question with per-player power-up info
  const enrichedQuestion = useMemo(() => {
    if (!question || !currentPlayer) return question;
    return {
      ...question,
      powerUpUsesLeft: currentPlayer.powerUpUses ?? 0,
      usedPowerUpTypes: (currentPlayer.usedPowerUpTypes ?? []) as QuestionPayload["usedPowerUpTypes"],
    };
  }, [question, currentPlayer]);

  const [lastQuestion, setLastQuestion] = useState(question);
  if (question && question !== lastQuestion) {
    setLastQuestion(question);
  }

  const handleStart = useCallback(async () => {
    try {
      await startGame(code, hostId, hostToken);
    } catch (e) {
      console.error("Failed to start game", e);
      showToast("Failed to start game");
    }
  }, [code, hostId, hostToken, startGame]);

  const handleAnswer = useCallback(
    async (index: number): Promise<boolean> => {
      try {
        await submitAnswer(code, playerId, playerToken, index);
        return true;
      } catch (e) {
        console.error("Failed to submit answer", e);
        // Show the server's own reason ("Can't answer right now" for a tap
        // that arrived after the question closed) rather than a generic
        // failure, and report the refusal so the UI can un-commit the choice.
        showToast(e instanceof Error ? e.message : "Failed to submit answer");
        return false;
      }
    },
    [code, playerId, playerToken, submitAnswer]
  );

  /**
   * Posts a room action and reports whether the server accepted it.
   *
   * Every one of these used to be a bare `await fetch(...)` inside a
   * try/catch. `fetch` resolves happily on a 400, so `catch` never ran and a
   * refusal — a late answer, a power-up already spent, a host action on a dead
   * room — produced no feedback whatsoever. The player or host simply saw
   * nothing happen and drew their own conclusion.
   */
  const postAction = useCallback(
    async (body: Record<string, unknown>, fallbackMessage: string): Promise<boolean> => {
      const send = () =>
        fetch(`${MP_API_URL}/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

      try {
        let res = await send();
        if (res.ok) return true;
        let payload = await res.json().catch(() => null);

        /*
         * Reclaim the seat and retry, once.
         *
         * A player who drops during the lobby is fully removed from the room
         * after the grace period — deliberately, so the host isn't stuck
         * waiting on ghosts. But their stored token then refers to a player
         * who no longer exists, and the *first they hear of it* was
         * "Invalid session" on their first answer, with no way back. Rejoining
         * is allowed while the room is still in the lobby, so do it for them.
         */
        if (payload?.error === "Invalid session" && playerName && playerId) {
          const rejoined = await joinRoom(code, playerId, playerName, playerEmoji).catch(() => null);
          if (rejoined?.playerToken) {
            sessionStorage.setItem("quiz-player-token", rejoined.playerToken);
            res = await send();
            if (res.ok) return true;
            payload = await res.json().catch(() => null);
          }
        }

        showToast(payload?.error ?? fallbackMessage);
        return false;
      } catch (e) {
        console.error(fallbackMessage, e);
        showToast(fallbackMessage);
        return false;
      }
    },
    [showToast, code, playerId, playerName, playerEmoji, joinRoom]
  );

  const handleYearAnswer = useCallback(
    async (year: number): Promise<boolean> => {
      if (!playerId) return false;
      return postAction(
        { action: "answer-year", code, playerId, token: playerToken, year },
        "Failed to submit answer"
      );
    },
    [code, playerId, playerToken, postAction]
  );

  const handleTextAnswer = useCallback(
    async (text: string): Promise<boolean> => {
      if (!playerId) return false;
      return postAction(
        { action: "answer-text", code, playerId, token: playerToken, answer: text },
        "Failed to submit answer"
      );
    },
    [code, playerId, playerToken, postAction]
  );

  const handleNext = useCallback(async () => {
    try {
      await nextQuestion(code, hostId, hostToken);
    } catch (e) {
      console.error("Failed to advance", e);
      showToast("Failed to advance");
    }
  }, [code, hostId, hostToken, nextQuestion]);

  const handleReact = useCallback(
    async (emoji: string) => {
      try {
        await sendReaction(code, playerId, playerToken, emoji);
      } catch (e) {
        console.error("Failed to send reaction", e);
        showToast("Failed to send reaction");
      }
    },
    [code, playerId, playerToken, sendReaction]
  );

  const handleWager = useCallback(
    async (amount: number) => {
      try {
        await submitWager(code, playerId, playerToken, amount);
      } catch (e) {
        console.error("Failed to submit wager", e);
        showToast("Failed to submit wager");
      }
    },
    [code, playerId, playerToken, submitWager, showToast]
  );

  const handleAdvanceFromWager = useCallback(async () => {
    await postAction(
      { action: "advance-wager", code, hostId, hostToken },
      "Failed to advance from wager"
    );
  }, [code, hostId, hostToken, postAction]);

  const handleChoosePowerUp = useCallback(
    async (powerUp: "freeze" | "shield" | "double") => {
      if (!playerId) return;
      await postAction(
        { action: "choose-powerup", code, playerId, token: playerToken, powerUp },
        "Couldn't use that power-up"
      );
    },
    [code, playerId, playerToken, postAction]
  );

  const handleExit = useCallback(() => {
    try {
      fetch(`${MP_API_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", code, playerId }),
      });
    } catch {}
    router.push("/play");
  }, [code, playerId, router]);

  const handleTimerExpire = useCallback(async () => {
    if (!isHost) return;
    await postAction(
      { action: "force-results", code, hostId, hostToken },
      "Failed to end timer"
    );
  }, [isHost, code, hostId, hostToken, postAction]);

  /**
   * What a screen reader should hear about the room right now.
   *
   * Ordered by urgency, because one polite region can only say one thing: a
   * dropped connection matters more than an answer count. These all had
   * visible banners and no announcement at all before (8.2).
   */
  const announcement = useMemo(() => {
    if (roomError) return roomError;
    if (!connected && state) return "Connection lost. Reconnecting.";
    if (eliminatedEvent) {
      return eliminatedEvent.playerId === playerId
        ? "You have been eliminated. You can keep watching."
        : `${eliminatedEvent.playerName} is out.`;
    }
    if (playerLeftEvent && playerLeftEvent.playerId !== playerId) {
      return `${playerLeftEvent.playerName} left the game.`;
    }
    if (state === "question" && answerCount && answerCount.total > 0) {
      return `${answerCount.count} of ${answerCount.total} players have answered.`;
    }
    if (state === "results") return "Results are in.";
    if (state === "finished") return "Game over.";
    return "";
  }, [roomError, connected, state, eliminatedEvent, playerLeftEvent, answerCount, playerId]);

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
      <div className="flex min-h-svh items-center justify-center">
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
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
          <p className="font-bold text-white/50">
            {connected ? t("game.loading") : t("game.connecting")}
          </p>
        </div>
      </div>
    );
  }

  // The snapshot's count is authoritative and is the only one that exists in
  // the lobby; the 15 was a guess that happened to match the default quiz.
  const totalQuestions = question?.total ?? lastQuestion?.total ?? roomTotalQuestions ?? 15;
  const currentIndex = question?.index ?? lastQuestion?.index ?? 0;
  const isLastQuestion = currentIndex + 1 >= totalQuestions;

  return (
    <div className="relative flex min-h-svh flex-col">
      {/* Toast notification */}
      {toast && (
        <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 animate-fade-in-up">
          <div className="flex items-center gap-2 rounded-xl bg-error px-4 py-2.5 shadow-lg">
            <AlertTriangle className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white">{toast}</span>
          </div>
        </div>
      )}

      <LiveRegion message={announcement} />

      {/* Reconnecting banner */}
      {!connected && state && !roomError && (
        <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-xl bg-yellow-600 px-4 py-2 shadow-lg">
            <WifiOff className="h-4 w-4 animate-pulse text-white" />
            <span className="text-sm font-bold text-white">Reconnecting...</span>
          </div>
        </div>
      )}

      {/* Player left toast */}
      {/* Someone was knocked out. The server has always broadcast this and the
          hook has always stored it, but nothing rendered it — in elimination
          mode a player simply stopped being able to play, unannounced. */}
      {eliminatedEvent && connected && (
        <div className="fixed left-1/2 top-16 z-[56] -translate-x-1/2 animate-bounce-in">
          <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-error/40 bg-error/15 px-4 py-2.5 shadow-lg backdrop-blur-md">
            <Skull className="h-4 w-4 shrink-0 text-error" />
            <Avatar value={eliminatedEvent.playerEmoji} size={24} />
            <span className="text-sm font-bold text-white">
              {eliminatedEvent.playerId === playerId
                ? "You're out!"
                : `${eliminatedEvent.playerName} is out`}
            </span>
          </div>
        </div>
      )}

      {playerLeftEvent && connected && playerLeftEvent.playerId !== playerId && (
        <div className="fixed left-1/2 top-16 z-[55] -translate-x-1/2 animate-fade-in-up">
          <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-white/10 bg-black/70 px-3 py-2 shadow-lg backdrop-blur-md">
            <Avatar value={playerLeftEvent.playerEmoji} size={24} />
            <span className="text-sm font-bold text-white">{playerLeftEvent.playerName} left</span>
            <WifiOff className="h-3.5 w-3.5 text-white/50" />
          </div>
        </div>
      )}

      {/* Exit button */}
      <button
        onClick={handleExit}
        className="tap-target fixed right-4 top-4 z-50 rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Global emoji reactions overlay — visible to all players in all states */}
      <EmojiReactions reactions={reactions} />

      <main className="relative z-10 mx-auto flex w-[92%] max-w-5xl flex-1 flex-col px-2 py-3 sm:px-8 sm:py-6">
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
          <PlayerLobby
            code={code}
            players={players}
            playerName={playerName}
            playerEmoji={playerEmoji}
            gameMode={gameMode}
            totalQuestions={roomTotalQuestions}
            teamNames={teamNames}
            myTeamIndex={currentPlayer?.teamIndex ?? null}
          />
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
            wagerType={wager?.wagerType}
          />
        )}

        {state === "wager" && !isHost && (
          <WagerScreen
            currentScore={currentPlayer?.score ?? 0}
            onSubmit={handleWager}
            wagerType={wager?.wagerType}
          />
        )}

        {state === "question" && question && isHost && !isHostPlayer && (
          <HostQuestion
            question={question}
            answerCount={answerCount}
            onTimerExpire={handleTimerExpire}
            // Same server action the timer fires — `force-results` doesn't
            // require the clock to have run out, it just wasn't reachable.
            onReveal={handleTimerExpire}
            players={players}
            teamNames={teamNames}
          />
        )}

        {state === "question" && question && isHost && isHostPlayer && (
          question.type === "fastest-finger" ? (
            <FastestFingerInput
              question={question}
              onAnswer={handleTextAnswer}
              onTimerExpire={handleTimerExpire}
              timerReduction={timerReduction}
              streak={myStreak}
              eliminated={currentPlayer?.eliminated ?? false}
            />
          ) : question.type === "year-guesser" ? (
            <YearGuesserInput
              question={question}
              onAnswer={handleYearAnswer}
              onTimerExpire={handleTimerExpire}
              timerReduction={timerReduction}
              streak={myStreak}
              eliminated={currentPlayer?.eliminated ?? false}
            />
          ) : (
            <PlayerQuestion
              question={enrichedQuestion!}
              onAnswer={handleAnswer}
              onTimerExpire={handleTimerExpire}
              timerReduction={timerReduction}
              answerCount={answerCount}
              connected={connected}
              playerId={playerId}
              eliminated={currentPlayer?.eliminated ?? false}
              canAnswer={canAnswer}
              waitingPlayerName={waitingPlayerName}
              onChoosePowerUp={handleChoosePowerUp}
              streak={myStreak}
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
              streak={myStreak}
              eliminated={currentPlayer?.eliminated ?? false}
            />
          ) : question.type === "year-guesser" ? (
            <YearGuesserInput
              question={question}
              onAnswer={handleYearAnswer}
              onTimerExpire={handleTimerExpire}
              timerReduction={timerReduction}
              streak={myStreak}
              eliminated={currentPlayer?.eliminated ?? false}
            />
          ) : (
            <PlayerQuestion
              question={enrichedQuestion!}
              onAnswer={handleAnswer}
              onTimerExpire={handleTimerExpire}
              timerReduction={timerReduction}
              answerCount={answerCount}
              connected={connected}
              playerId={playerId}
              eliminated={currentPlayer?.eliminated ?? false}
              canAnswer={canAnswer}
              waitingPlayerName={waitingPlayerName}
              onChoosePowerUp={handleChoosePowerUp}
              streak={myStreak}
            />
          )
        )}

        {state === "results" && results && isHost && !isHostPlayer && (
          <HostResults
            key={currentIndex}
            question={lastQuestion}
            results={results}
            reactions={reactions}
            isLast={isLastQuestion}
            onNext={handleNext}
            gameMode={gameMode}
          />
        )}

        {state === "results" && results && isHost && isHostPlayer && (
          <PlayerResults playerId={playerId} results={results} question={lastQuestion} onReact={handleReact} eliminated={currentPlayer?.eliminated ?? false}>
            <button
              onClick={handleNext}
              className="btn-primary flex items-center justify-center gap-2 w-full text-lg mt-4"
            >
              {isLastQuestion ? <>{t("game.results")} <Trophy className="h-5 w-5" /></> : <>{t("game.nextQuestion")} <ArrowRight className="h-5 w-5" /></>}
            </button>
          </PlayerResults>
        )}

        {state === "results" && results && !isHost && (
          <PlayerResults playerId={playerId} results={results} question={lastQuestion} onReact={handleReact} eliminated={currentPlayer?.eliminated ?? false} />
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
