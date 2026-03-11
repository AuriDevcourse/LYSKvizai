"use client";

import {
  CheckCircle, ArrowRight, BarChart3, Trophy, Award, Triangle, Diamond, Circle, Square,
  Skull, Users, Coins, Zap, Sparkles, Calendar,
} from "lucide-react";
import type { ResultsPayload, QuestionPayload, GameMode } from "@/lib/multiplayer/types";
import type { EmojiReactionWithId } from "@/hooks/useRoom";
import EmojiReactions from "./EmojiReactions";
import Avatar from "@/components/Avatar";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const OPTION_STYLES = [
  { border: "border-[#e21b3c]", bg: "bg-[#e21b3c]", barBg: "bg-[#e21b3c]/30", iconBg: "bg-[#e21b3c]", icon: Triangle },
  { border: "border-[#1368ce]", bg: "bg-[#1368ce]", barBg: "bg-[#1368ce]/30", iconBg: "bg-[#1368ce]", icon: Diamond },
  { border: "border-[#26890c]", bg: "bg-[#26890c]", barBg: "bg-[#26890c]/30", iconBg: "bg-[#26890c]", icon: Circle },
  { border: "border-[#d89e00]", bg: "bg-[#d89e00]", barBg: "bg-[#d89e00]/30", iconBg: "bg-[#d89e00]", icon: Square },
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
  const { t, lang } = useTranslation();
  const useEn = lang !== "lt" && results.en;
  const correctText = results.correctAnswerText ?? question?.options[results.correctAnswer] ?? "";
  const tCorrectAnswer = useEn && results.en?.correctAnswerText ? results.en.correctAnswerText : (useEn && results.en?.options ? results.en.options[results.correctAnswer] : correctText);
  const tExplanation = useEn && results.en?.explanation ? results.en.explanation : (results.explanation ?? "");
  const tOptions = useEn && results.en?.options ? results.en.options : (question?.options ?? ["", "", "", ""]);
  const totalAnswers = results.answerDistribution.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <EmojiReactions reactions={reactions} />

      {/* Elimination announcement */}
      {results.eliminatedThisRound && results.eliminatedThisRound.length > 0 && (
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-[#e21b3c]/20 px-6 py-5">
          <Skull className="h-7 w-7 text-[#e21b3c]" />
          <div className="text-center">
            <p className="text-sm font-bold text-white/60">{t("hostResults.eliminated")}</p>
            {results.eliminatedThisRound.map((el) => (
              <p key={el.playerId} className="inline-flex items-center gap-2 text-xl font-extrabold text-white">
                <Avatar value={el.playerEmoji} size={28} /> {el.playerName}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Bluff reveal */}
      {results.bluffAnswer && (
        <div className="rounded-2xl bg-purple-500/15 px-6 py-5">
          <div className="flex items-center gap-2 text-sm font-extrabold text-purple-300">
            <Zap className="h-5 w-5" />
            {t("hostResults.bluff")}
          </div>
          <p className="mt-1 text-lg font-bold text-white">
            {t("hostResults.fakeAnswer")} <span className="text-purple-200">{results.bluffAnswer}</span>
          </p>
          {results.bluffVictims && results.bluffVictims.length > 0 && (
            <p className="mt-1 text-sm font-bold text-purple-200/60">
              {t("hostResults.fellForIt")} {results.bluffVictims.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Mystery Multiplier reveal */}
      {results.mysteryMultiplier && results.mysteryMultiplier > 1 && (
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-[#d89e00]/20 px-6 py-5 animate-bounce-in">
          <Sparkles className="h-7 w-7 text-[#d89e00]" />
          <p className="text-2xl font-extrabold text-[#d89e00]">
            {t("hostResults.mystery")} x{results.mysteryMultiplier}!
          </p>
          <Sparkles className="h-7 w-7 text-[#d89e00]" />
        </div>
      )}

      {/* Fastest Finger banner */}
      {results.fastestFinger && (
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-[#d89e00]/20 px-6 py-5 animate-bounce-in">
          <Zap className="h-7 w-7 text-[#d89e00]" />
          <p className="text-2xl font-extrabold text-[#d89e00]">
            {t("hostResults.fastestFinger")} {results.fastestFinger.playerName}
          </p>
          <Zap className="h-7 w-7 text-[#d89e00]" />
        </div>
      )}

      {/* Correct answer — big and bold */}
      {results.yearGuesses && results.yearGuesses.length > 0 ? (
        <div className="rounded-2xl bg-[#26890c] px-6 py-5">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 shrink-0 text-white" />
            <div>
              <p className="text-sm font-bold text-white/70">{t("hostResults.correctYear")}</p>
              <p className="text-4xl font-extrabold text-white">
                {results.yearGuesses[0].correctYear}
              </p>
            </div>
          </div>
          {results.explanation && (
            <p className="mt-3 text-base font-medium text-white/80">{tExplanation}</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#26890c] px-6 py-5">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 shrink-0 text-white" />
            <div>
              <p className="text-sm font-bold text-white/70">{t("hostResults.correctAnswer")}</p>
              <p className="text-2xl font-extrabold text-white">
                {tCorrectAnswer}
              </p>
            </div>
          </div>
          {results.explanation && (
            <p className="mt-3 text-base font-medium text-white/80">{tExplanation}</p>
          )}
        </div>
      )}

      {/* Wager results */}
      {results.wagerResults && results.wagerResults.length > 0 && (
        <div className="rounded-2xl glass px-6 py-5">
          <div className="mb-4 flex items-center justify-center gap-2 font-extrabold text-[#d89e00]">
            <Coins className="h-5 w-5" />
            {t("hostResults.wagerResults")}
          </div>
          <div className="flex flex-col gap-3">
            {results.wagerResults.map((wr) => (
              <div key={wr.playerId} className="flex flex-col items-center text-center">
                <span className="font-bold text-white">{wr.playerName}</span>
                <span className={`text-sm font-extrabold ${wr.won ? "text-[#26890c]" : "text-[#e21b3c]"}`}>
                  {wr.won ? t("hostResults.wagerWon") : t("hostResults.wagerLost")}
                </span>
                <span className={`text-2xl font-extrabold ${wr.won ? "text-[#26890c]" : "text-[#e21b3c]"}`}>
                  {wr.won ? "+" : ""}{wr.netPoints} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Power-up effects */}
      {results.powerUpEffects && results.powerUpEffects.length > 0 && (
        <div className="rounded-2xl glass px-6 py-5">
          <div className="mb-3 flex items-center gap-2 font-extrabold text-cyan-300">
            <Zap className="h-5 w-5" />
            {t("hostResults.powerUpEffects")}
          </div>
          <div className="flex flex-col gap-1">
            {results.powerUpEffects.map((pe, i) => (
              <p key={i} className="text-base font-bold text-white">
                {pe.playerName}: <span className="text-white/70">{pe.effect}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Year Guesser — player guesses visual */}
      {results.yearGuesses && results.yearGuesses.length > 0 && (() => {
        const correctYear = results.yearGuesses[0].correctYear;
        const guesses = results.yearGuesses;
        return (
          <div className="rounded-2xl glass px-6 py-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white/60">
              <Calendar className="h-5 w-5" />
              {t("hostResults.guesses")}
            </div>
            <div className="flex flex-col gap-2">
              {guesses.map((g) => {
                const diff = g.guessedYear - correctYear;
                const absDiff = Math.abs(diff);
                const color = absDiff === 0
                  ? "text-[#26890c]"
                  : absDiff <= 5
                    ? "text-[#d89e00]"
                    : absDiff <= 25
                      ? "text-white"
                      : "text-[#e21b3c]";
                return (
                  <div key={g.playerId} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <span className="font-bold text-white">{g.playerName}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-extrabold ${color}`}>
                        {g.guessedYear}
                      </span>
                      <span className="text-sm font-bold text-white/50">
                        {absDiff === 0 ? t("hostResults.exact") : `${diff > 0 ? "+" : ""}${diff}`}
                      </span>
                      <span className="min-w-[4rem] text-right text-base font-extrabold text-emerald-300">
                        +{g.points}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Answer distribution (hidden for year-guesser) */}
        <div className={results.yearGuesses && results.yearGuesses.length > 0 ? "hidden" : ""}>
          <div className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white/60">
            <BarChart3 className="h-5 w-5" />
            {t("hostResults.answers")}
          </div>
          <div className="flex flex-col gap-2.5">
            {tOptions.map((option, i) => {
              const count = results.answerDistribution[i];
              const pct = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
              const isCorrect = i === results.correctAnswer;
              const isBluff = results.bluffIndex === i;
              const style = OPTION_STYLES[i];
              const Icon = style.icon;

              return (
                <div key={i} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
                  >
                    <Icon className="h-4.5 w-4.5 text-white" fill="currentColor" />
                  </span>
                  <div className="flex-1">
                    <div
                      className={`relative overflow-hidden rounded-xl border-2 px-4 py-3 ${
                        isCorrect
                          ? `${style.border} bg-white/10`
                          : isBluff
                            ? "border-purple-400 bg-purple-400/10"
                            : `${style.border} border-opacity-30 bg-white/[0.03]`
                      }`}
                    >
                      <div
                        className={`absolute inset-y-0 left-0 ${style.barBg}`}
                        style={{ width: `${pct}%` }}
                      />
                      <span className="relative flex items-center gap-2 text-base font-bold text-white">
                        {isCorrect && <CheckCircle className="h-4 w-4 shrink-0 text-[#26890c]" />}
                        {isBluff && <Zap className="h-4 w-4 shrink-0 text-purple-400" />}
                        {option}
                      </span>
                    </div>
                  </div>
                  <span className="min-w-[3ch] text-right text-base font-extrabold text-white">
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
              <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white/60">
                <Users className="h-5 w-5" />
                {t("hostResults.teams")}
              </div>
              <div className="flex flex-col gap-1.5">
                {results.teamScores.map((ts) => (
                  <div
                    key={ts.teamIndex}
                    className="flex items-center justify-between rounded-xl glass px-4 py-3"
                  >
                    <span className="font-bold text-white">{ts.teamName}</span>
                    <span className="font-extrabold text-white">{ts.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 5 leaderboard */}
          <div className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white/60">
            <Trophy className="h-5 w-5" />
            {t("hostResults.leaders")}
          </div>
          <div className="flex flex-col gap-1.5">
            {results.leaderboard.slice(0, 5).map((entry) => (
              <div
                key={entry.playerId}
                className="flex items-center justify-between rounded-xl glass px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {entry.rank <= 3 ? (
                    <Award className={`h-6 w-6 ${
                      entry.rank === 1 ? "text-yellow-400" :
                      entry.rank === 2 ? "text-gray-300" :
                      "text-amber-700"
                    }`} />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center text-sm font-extrabold text-white/50">
                      {entry.rank}
                    </span>
                  )}
                  <Avatar value={entry.emoji} size={32} />
                  <span className="text-base font-bold text-white">{entry.name}</span>
                </div>
                <span className="text-lg font-extrabold text-white">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="btn-primary flex items-center justify-center gap-2 w-full text-lg"
      >
        {isLast ? (
          <>
            <Trophy className="h-5 w-5" />
            {t("game.results")}
          </>
        ) : (
          <>
            {t("hostResults.nextQuestion")}
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </div>
  );
}
