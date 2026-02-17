"use client";

import {
  CheckCircle, ArrowRight, BarChart3, Trophy, Award, Triangle, Diamond, Circle, Square,
  Skull, Users, Coins, Zap,
} from "lucide-react";
import type { ResultsPayload, QuestionPayload, GameMode } from "@/lib/multiplayer/types";
import type { EmojiReactionWithId } from "@/hooks/useRoom";
import EmojiReactions from "./EmojiReactions";

const OPTION_STYLES = [
  { border: "border-red-400", bg: "bg-red-500", barBg: "bg-red-400/25", iconBg: "bg-red-500", icon: Triangle },
  { border: "border-blue-400", bg: "bg-blue-500", barBg: "bg-blue-400/25", iconBg: "bg-blue-500", icon: Diamond },
  { border: "border-emerald-400", bg: "bg-emerald-500", barBg: "bg-emerald-400/25", iconBg: "bg-emerald-500", icon: Circle },
  { border: "border-amber-400", bg: "bg-amber-500", barBg: "bg-amber-400/25", iconBg: "bg-amber-500", icon: Square },
];

interface HostResultsProps {
  question: QuestionPayload | null;
  results: ResultsPayload;
  reactions: EmojiReactionWithId[];
  isLast: boolean;
  onNext: () => void;
  gameMode?: GameMode;
}

export default function HostResults({
  question,
  results,
  reactions,
  isLast,
  onNext,
  gameMode = "classic",
}: HostResultsProps) {
  const totalAnswers = results.answerDistribution.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <EmojiReactions reactions={reactions} />

      {/* Elimination announcement */}
      {results.eliminatedThisRound && results.eliminatedThisRound.length > 0 && (
        <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-red-400/30 bg-red-400/10 px-5 py-4">
          <Skull className="h-6 w-6 text-red-400" />
          <div className="text-center">
            <p className="text-sm text-red-200/60">Pašalintas!</p>
            {results.eliminatedThisRound.map((el) => (
              <p key={el.playerId} className="text-lg font-bold text-red-100">
                {el.playerEmoji} {el.playerName}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Bluff reveal */}
      {results.bluffAnswer && (
        <div className="rounded-xl border-2 border-purple-400/30 bg-purple-400/10 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
            <Zap className="h-4 w-4" />
            Apgaulė!
          </div>
          <p className="mt-1 text-amber-100">
            Netikras atsakymas: <span className="font-bold text-purple-200">{results.bluffAnswer}</span>
          </p>
          {results.bluffVictims && results.bluffVictims.length > 0 && (
            <p className="mt-1 text-sm text-purple-200/60">
              Patikėjo: {results.bluffVictims.join(", ")} ({results.bluffVictims.length})
            </p>
          )}
        </div>
      )}

      {/* Correct answer */}
      <div className="flex items-start gap-3 rounded-xl border-2 border-emerald-400/30 bg-emerald-400/10 px-5 py-4">
        <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm text-emerald-200/60">Teisingas atsakymas</p>
          <p className="mt-1 text-lg font-bold text-emerald-100">
            {question?.options[results.correctAnswer]}
          </p>
          <p className="mt-2 text-sm text-emerald-200/50">{results.explanation}</p>
        </div>
      </div>

      {/* Wager results */}
      {results.wagerResults && results.wagerResults.length > 0 && (
        <div className="rounded-xl border-2 border-amber-400/20 bg-amber-400/5 px-5 py-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-300">
            <Coins className="h-4 w-4" />
            Statymų rezultatai
          </div>
          <div className="flex flex-col gap-1">
            {results.wagerResults.map((wr) => (
              <div key={wr.playerId} className="flex items-center justify-between text-sm">
                <span className="text-amber-100">{wr.playerName}</span>
                <span className={`font-bold ${wr.won ? "text-emerald-300" : "text-red-300"}`}>
                  {wr.won ? "+" : ""}{wr.netPoints} (statė {wr.wager})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Power-up effects */}
      {results.powerUpEffects && results.powerUpEffects.length > 0 && (
        <div className="rounded-xl border-2 border-cyan-400/20 bg-cyan-400/5 px-5 py-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-cyan-300">
            <Zap className="h-4 w-4" />
            Galių efektai
          </div>
          <div className="flex flex-col gap-1">
            {results.powerUpEffects.map((pe, i) => (
              <p key={i} className="text-sm text-cyan-100">
                {pe.playerName}: {pe.effect}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Answer distribution */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-amber-200/50">
            <BarChart3 className="h-4 w-4" />
            <span>Atsakymų pasiskirstymas</span>
          </div>
          <div className="flex flex-col gap-2">
            {question?.options.map((option, i) => {
              const count = results.answerDistribution[i];
              const pct = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
              const isCorrect = i === results.correctAnswer;
              const isBluff = results.bluffIndex === i;
              const style = OPTION_STYLES[i];
              const Icon = style.icon;

              return (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}
                  >
                    <Icon className="h-4 w-4 text-white" fill="currentColor" />
                  </span>
                  <div className="flex-1">
                    <div
                      className={`relative overflow-hidden rounded-lg border-2 px-3 py-2 ${style.border} ${
                        isCorrect ? "border-opacity-100 bg-white/5 ring-1 ring-white/20" :
                        isBluff ? "border-purple-400 border-opacity-100 bg-purple-400/10" :
                        "border-opacity-30 bg-white/[0.02]"
                      }`}
                    >
                      <div
                        className={`absolute inset-y-0 left-0 ${style.barBg}`}
                        style={{ width: `${pct}%` }}
                      />
                      <span className="relative flex items-center gap-1.5 text-sm text-amber-50">
                        {isCorrect && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                        {isBluff && <Zap className="h-3.5 w-3.5 shrink-0 text-purple-400" />}
                        {option}
                      </span>
                    </div>
                  </div>
                  <span className="min-w-[3ch] text-right text-sm font-bold text-amber-200">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard / Team scores */}
        <div>
          {/* Team scores */}
          {results.teamScores && results.teamScores.length > 0 && (
            <div className="mb-4">
              <div className="mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-amber-200/50">
                <Users className="h-4 w-4" />
                <span>Komandų taškai</span>
              </div>
              <div className="flex flex-col gap-1">
                {results.teamScores.map((ts) => (
                  <div
                    key={ts.teamIndex}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                  >
                    <span className="font-medium text-amber-100">{ts.teamName}</span>
                    <span className="font-bold text-amber-200">{ts.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 5 leaderboard */}
          <div className="mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-amber-200/50">
            <Trophy className="h-4 w-4" />
            <span>Lyderių lentelė</span>
          </div>
          <div className="flex flex-col gap-1">
            {results.leaderboard.slice(0, 5).map((entry) => (
              <div
                key={entry.playerId}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  {entry.rank <= 3 ? (
                    <Award className={`h-5 w-5 ${
                      entry.rank === 1 ? "text-amber-400" :
                      entry.rank === 2 ? "text-gray-300" :
                      "text-amber-600"
                    }`} />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center text-sm font-bold text-amber-400">
                      {entry.rank}
                    </span>
                  )}
                  <span className="text-lg">{entry.emoji}</span>
                  <span className="text-amber-50">{entry.name}</span>
                </div>
                <span className="font-bold text-amber-200">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-8 py-4 text-lg font-bold text-amber-950 transition-colors hover:bg-amber-400"
      >
        {isLast ? (
          <>
            <Trophy className="h-5 w-5" />
            Rodyti rezultatus
          </>
        ) : (
          <>
            Kitas klausimas
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </div>
  );
}
