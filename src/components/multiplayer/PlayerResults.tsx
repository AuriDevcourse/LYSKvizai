"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, Clock, Flame, Skull, Zap, TrendingDown, Eye, ChevronUp, ChevronDown } from "lucide-react";
import type { ResultsPayload, QuestionPayload } from "@/lib/multiplayer/types";
import ReactionPicker from "./ReactionPicker";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { ANSWER_BG } from "@/lib/answer-options";
import { haptic } from "@/lib/haptics";

const ANSWER_COLORS = ANSWER_BG;

interface PlayerResultsProps {
  playerId: string;
  results: ResultsPayload;
  question?: QuestionPayload | null;
  onReact?: (emoji: string) => void;
  children?: React.ReactNode;
  /**
   * Whether this player is out of the game — not just eliminated this round.
   * Without it, someone knocked out in round 3 is told "No Answer" for every
   * round after, which is the same message as a player who simply didn't tap
   * in time.
   */
  eliminated?: boolean;
}

export default function PlayerResults({ playerId, results, question, onReact, children, eliminated = false }: PlayerResultsProps) {
  const { t } = useTranslation();
  const myResult = results.playerResults.find((r) => r.playerId === playerId);
  const wasEliminated = results.eliminatedThisRound?.some((el) => el.playerId === playerId);

  /** This player's line on the leaderboard, which was already being sent. */
  const myStanding = results.leaderboard?.find((e) => e.playerId === playerId);
  const rankDelta =
    myStanding?.previousRank !== undefined ? myStanding.previousRank - myStanding.rank : 0;

  /**
   * Buzz the result into the hand.
   *
   * Players are watching the host screen when the reveal lands, so the phone
   * is the one channel that reaches them without their looking down. The
   * `error` pattern was defined in `lib/haptics.ts` and never called by
   * anything until now.
   */
  useEffect(() => {
    if (!myResult) return;
    haptic(myResult.correct ? "commit" : "error");
  }, [myResult]);

  const options = question
    ? question.options
    : (results.options ?? null);

  const correctIndex = results.correctAnswer;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden w-full max-w-sm mx-auto px-4">
      {/* Eliminated announcement */}
      {wasEliminated && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-red-400/30 bg-error/20 px-6 py-4">
          <Skull className="h-8 w-8 text-red-400" />
          <div>
            <p className="text-lg font-bold text-red-100">{t("playerResults.eliminated")}</p>
            <p className="text-sm text-red-200/60">{t("playerResults.canWatch")}</p>
          </div>
        </div>
      )}

      {/* Correct/Incorrect indicator + points */}
      {myResult ? (
        <div className="flex flex-col items-center gap-2">
          {myResult.correct ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-answer-green/20 animate-bounce-in">
              <CheckCircle className="h-9 w-9 text-answer-green" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-400/15 animate-bounce-in">
              <XCircle className="h-9 w-9 text-red-400" />
            </div>
          )}
          {/* Points earned */}
          <p className={`text-3xl font-extrabold animate-bounce-in ${
            myResult.points > 0 ? "text-emerald-300" : myResult.points < 0 ? "text-red-400" : "text-white/50"
          }`}>
            {myResult.points > 0 ? "+" : ""}{myResult.points} {t("playerResults.pts")}
          </p>
          {/* Fastest bonus */}
          {myResult.speedBonus && myResult.speedBonus > 0 && (
            <div className="flex items-center gap-1.5 text-sm font-bold text-answer-yellow">
              <Zap className="h-4 w-4" />
              <span>{t("playerResults.fastest")} +{myResult.speedBonus}</span>
            </div>
          )}
          {/* Slowest penalty */}
          {myResult.slowPenalty && myResult.slowPenalty < 0 && (
            <div className="flex items-center gap-1.5 text-sm font-bold text-red-400">
              <TrendingDown className="h-4 w-4" />
              <span>{myResult.slowPenalty}</span>
            </div>
          )}
          {/* Streak */}
          {myResult.streak >= 2 && (
            <div className="flex items-center gap-1.5 text-sm font-bold text-orange-300">
              <Flame className="h-4 w-4 text-orange-400" />
              <span>{myResult.streak} {t("playerResults.inARow")}</span>
            </div>
          )}
          {/* Power-up effect */}
          {myResult.powerUpEffect && (
            <div className="flex items-center gap-1.5 text-sm font-bold text-cyan-300">
              <Zap className="h-4 w-4" />
              <span>{myResult.powerUpEffect}</span>
            </div>
          )}
        </div>
      ) : eliminated ? (
        /* Out of the game — not the same thing as failing to answer, even
           though both produce no result row. */
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <Eye className="h-9 w-9 text-white/70" />
          </div>
          <h2 className="font-headline text-xl font-extrabold text-white/70">Spectating</h2>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <Clock className="h-9 w-9 text-white" />
          </div>
          <h2 className="font-headline text-xl font-extrabold text-white">{t("playerResults.noAnswer")}</h2>
        </div>
      )}

      {/* 4.4 — the player's own standing. `rank` and `previousRank` were in
          every results payload already; nothing ever showed them, so players
          could only find out where they stood by squinting at the host TV. */}
      {myStanding && (
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-5 py-2.5">
          <div className="flex items-baseline gap-1">
            <span className="font-headline text-2xl font-black text-white tabular-nums">
              {myStanding.rank}
            </span>
            <span className="text-xs font-bold text-white/50">
              /{results.leaderboard?.length ?? 0}
            </span>
          </div>
          {rankDelta !== 0 && (
            <span
              className={`flex items-center gap-0.5 text-sm font-extrabold ${
                rankDelta > 0 ? "text-answer-green" : "text-error"
              }`}
            >
              {rankDelta > 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {Math.abs(rankDelta)}
            </span>
          )}
          <span className="text-sm font-bold tabular-nums text-white/55">
            {myStanding.score} {t("playerResults.pts")}
          </span>
        </div>
      )}

      {/* Correct answer reveal */}
      {options && (
        <div className="w-full">
          <div className={`grid gap-2 ${options.filter(o => o !== "").length <= 2 ? "grid-cols-2 max-w-xs mx-auto" : "grid-cols-2"}`}>
            {options.map((option, i) => {
              if (option === "") return null;
              const isCorrect = i === correctIndex;
              return (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2.5 text-center text-sm font-bold transition-all ${
                    isCorrect
                      ? `${ANSWER_COLORS[i]} text-white outline outline-[1.5px] outline-primary`
                      : `${ANSWER_COLORS[i]} text-white/45 opacity-40`
                  }`}
                >
                  {option}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {onReact && <ReactionPicker onReact={onReact} />}

      {children}

      {!children && (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Clock className="h-3.5 w-3.5" />
          <span>{t("playerResults.waitingForNext")}</span>
        </div>
      )}
    </div>
  );
}
