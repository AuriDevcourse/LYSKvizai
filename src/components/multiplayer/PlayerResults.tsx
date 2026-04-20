"use client";

import { CheckCircle, XCircle, Clock, Flame, Skull, Sparkles, Zap, TrendingDown } from "lucide-react";
import type { ResultsPayload, QuestionPayload } from "@/lib/multiplayer/types";
import ReactionPicker from "./ReactionPicker";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const ANSWER_COLORS = [
  "bg-[#ff716c]",
  "bg-[#43a5fc]",
  "bg-[#66bb6a]",
  "bg-[#c9a825]",
];

interface PlayerResultsProps {
  playerId: string;
  results: ResultsPayload;
  question?: QuestionPayload | null;
  onReact?: (emoji: string) => void;
  children?: React.ReactNode;
}

export default function PlayerResults({ playerId, results, question, onReact, children }: PlayerResultsProps) {
  const { t } = useTranslation();
  const myResult = results.playerResults.find((r) => r.playerId === playerId);
  const wasEliminated = results.eliminatedThisRound?.some((el) => el.playerId === playerId);

  const options = question
    ? (question.en?.options ?? question.options)
    : (results.en?.options ?? null);

  const correctIndex = results.correctAnswer;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden w-full max-w-sm mx-auto px-4">
      {/* Eliminated announcement */}
      {wasEliminated && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-red-400/30 bg-[#ff716c]/20 px-6 py-4">
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#66bb6a]/20 animate-bounce-in">
              <CheckCircle className="h-9 w-9 text-[#66bb6a]" />
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
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#c9a825]">
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
          {/* Mystery multiplier */}
          {results.mysteryMultiplier && results.mysteryMultiplier > 1 && myResult.correct && (
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#c9a825]">
              <Sparkles className="h-4 w-4" />
              x{results.mysteryMultiplier}
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
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <Clock className="h-9 w-9 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-white">{t("playerResults.noAnswer")}</h2>
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
                      ? `${ANSWER_COLORS[i]} text-white outline outline-[1.5px] outline-[#ff9062]`
                      : `${ANSWER_COLORS[i]} text-white/30 opacity-40`
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
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Clock className="h-3.5 w-3.5" />
          <span>{t("playerResults.waitingForNext")}</span>
        </div>
      )}
    </div>
  );
}
