"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle, ArrowRight, Trophy, Award, Triangle, Diamond, Circle, Square,
  Skull, Users, Zap, Sparkles, Calendar, Flame, TrendingUp,
} from "lucide-react";
import type { ResultsPayload, QuestionPayload, GameMode } from "@/lib/multiplayer/types";
import type { EmojiReactionWithId } from "@/hooks/useRoom";
import EmojiReactions from "./EmojiReactions";
import Avatar from "@/components/Avatar";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const OPTION_BG = ["bg-[#e21b3c]", "bg-[#1368ce]", "bg-[#26890c]", "bg-[#d89e00]"];
const OPTION_BG_DIM = ["bg-[#e21b3c]/30", "bg-[#1368ce]/30", "bg-[#26890c]/30", "bg-[#d89e00]/30"];
const OPTION_ICONS = [Triangle, Diamond, Circle, Square];

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
  const [phase, setPhase] = useState<"reveal" | "leaderboard">("reveal");

  const useEn = lang !== "lt" && results.en;
  const useLt = lang === "lt" && results.lt;
  const correctText = results.correctAnswerText ?? question?.options[results.correctAnswer] ?? "";
  const tCorrectAnswer = useLt && results.lt?.correctAnswerText ? results.lt.correctAnswerText : useEn && results.en?.correctAnswerText ? results.en.correctAnswerText : (useEn && results.en?.options ? results.en.options[results.correctAnswer] : useLt && results.lt?.options ? results.lt.options[results.correctAnswer] : correctText);
  const tExplanation = useLt && results.lt?.explanation ? results.lt.explanation : useEn && results.en?.explanation ? results.en.explanation : (results.explanation ?? "");
  const tOptions = useLt && results.lt?.options ? results.lt.options : useEn && results.en?.options ? results.en.options : (question?.options ?? ["", "", "", ""]);
  const qText = question ? (
    lang === "lt" && question.lt ? question.lt.question :
    lang !== "lt" && question.en ? question.en.question :
    question.question
  ) : "";

  const sortedPlayers = useMemo(() => {
    return [...results.playerResults].sort((a, b) => b.totalScore - a.totalScore);
  }, [results.playerResults]);

  const maxScore = sortedPlayers[0]?.totalScore || 1;
  const isYearGuesser = results.yearGuesses && results.yearGuesses.length > 0;

  // ===== PHASE 1: FROZEN QUESTION WITH HIGHLIGHTED ANSWER =====
  if (phase === "reveal") {
    return (
      <div className="flex flex-1 flex-col animate-fade-in-up">
        <EmojiReactions reactions={reactions} />

        {/* Question number */}
        <div className="flex items-center gap-4 pb-3">
          <div className="rounded-lg bg-white/10 px-3 py-1 text-sm font-extrabold text-white/70">
            {question ? `${question.index + 1} / ${question.total}` : ""}
          </div>
          <div className="h-3 flex-1 rounded-full bg-white/10" />
        </div>

        {/* Question text */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="glass max-w-3xl rounded-2xl px-8 py-6">
            <h2 className="text-center text-2xl font-extrabold leading-snug text-white sm:text-3xl lg:text-4xl">
              {qText}
            </h2>
          </div>

          {question?.image && (
            <div className="max-w-md overflow-hidden rounded-xl">
              <img src={question.image} alt="" className="h-40 w-full object-cover sm:h-52" />
            </div>
          )}

          {/* Explanation */}
          {results.explanation && (
            <p className="max-w-2xl text-center text-base font-medium text-white/60">{tExplanation}</p>
          )}

          {/* Year Guesser correct year */}
          {isYearGuesser && (
            <div className="flex items-center gap-3 rounded-2xl bg-[#26890c] px-8 py-5 animate-bounce-in">
              <Calendar className="h-8 w-8 text-white" />
              <div>
                <p className="text-sm font-bold text-white/70">{t("hostResults.correctYear")}</p>
                <p className="text-4xl font-extrabold text-white">{results.yearGuesses![0].correctYear}</p>
              </div>
            </div>
          )}
        </div>

        {/* Answer options — frozen with correct highlighted (skip for year guesser) */}
        {!isYearGuesser && (
          <div className={`grid grid-cols-2 gap-2 pt-4 sm:gap-3 ${
            tOptions.filter(Boolean).length <= 2 ? "grid-rows-1" : "grid-rows-2"
          }`}>
            {tOptions.map((option, i) => {
              if (!option && tOptions.filter(Boolean).length <= 2) return null;
              const isCorrect = i === results.correctAnswer;
              const Icon = OPTION_ICONS[i];

              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 sm:px-8 sm:py-5 transition-all ${
                    isCorrect
                      ? `${OPTION_BG[i]} ring-4 ring-white`
                      : `${OPTION_BG_DIM[i]} opacity-40`
                  }`}
                >
                  <Icon className="h-7 w-7 shrink-0 text-white/90 sm:h-8 sm:w-8" fill="currentColor" />
                  <span className="flex-1 text-lg font-extrabold text-white sm:text-xl lg:text-2xl">
                    {option}
                  </span>
                  {isCorrect && <CheckCircle className="h-6 w-6 shrink-0 text-white" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Next → go to leaderboard phase */}
        <button
          onClick={() => setPhase("leaderboard")}
          className="btn-primary mt-4 flex items-center justify-center gap-2 w-full text-lg"
        >
          {t("hostResults.leaders")}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // ===== PHASE 2: LEADERBOARD =====
  return (
    <div className="flex flex-1 flex-col gap-5 animate-fade-in-up">
      <EmojiReactions reactions={reactions} />

      {/* Elimination announcement */}
      {results.eliminatedThisRound && results.eliminatedThisRound.length > 0 && (
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-[#e21b3c]/20 px-6 py-4">
          <Skull className="h-6 w-6 text-[#e21b3c]" />
          {results.eliminatedThisRound.map((el) => (
            <span key={el.playerId} className="inline-flex items-center gap-2 text-lg font-extrabold text-white">
              <Avatar value={el.playerEmoji} size={24} /> {el.playerName}
            </span>
          ))}
        </div>
      )}

      {/* Mystery Multiplier */}
      {results.mysteryMultiplier && results.mysteryMultiplier > 1 && (
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-[#d89e00]/20 px-5 py-3 animate-bounce-in">
          <Sparkles className="h-5 w-5 text-[#d89e00]" />
          <p className="text-lg font-extrabold text-[#d89e00]">x{results.mysteryMultiplier}!</p>
          <Sparkles className="h-5 w-5 text-[#d89e00]" />
        </div>
      )}

      {/* Fastest Finger */}
      {results.fastestFinger && (
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-[#d89e00]/20 px-5 py-3 animate-bounce-in">
          <Zap className="h-5 w-5 text-[#d89e00]" />
          <p className="text-lg font-extrabold text-[#d89e00]">
            {t("hostResults.fastestFinger")} {results.fastestFinger.playerName}
          </p>
        </div>
      )}

      {/* Year Guesser guesses */}
      {isYearGuesser && (
        <div className="flex flex-col gap-1.5">
          {results.yearGuesses!.map((g) => {
            const diff = g.guessedYear - g.correctYear;
            const absDiff = Math.abs(diff);
            const color = absDiff === 0 ? "text-[#26890c]" : absDiff <= 5 ? "text-[#d89e00]" : absDiff <= 25 ? "text-white" : "text-[#e21b3c]";
            return (
              <div key={g.playerId} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
                <span className="font-bold text-white">{g.playerName}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-extrabold ${color}`}>{g.guessedYear}</span>
                  <span className="text-sm font-bold text-white/50">
                    {absDiff === 0 ? t("hostResults.exact") : `${diff > 0 ? "+" : ""}${diff}`}
                  </span>
                  <span className="min-w-[3.5rem] text-right text-base font-extrabold text-emerald-300">+{g.points}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== LEADERBOARD ===== */}
      {!isYearGuesser && (
        <div className="flex flex-col gap-2 stagger-children">
          {sortedPlayers.map((player, idx) => {
            const rank = idx + 1;
            const barWidth = maxScore > 0 ? (player.totalScore / maxScore) * 100 : 0;

            return (
              <div
                key={player.playerId}
                className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white/5 px-4 py-3 sm:px-5 sm:py-4"
              >
                {/* Score bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ${
                    player.correct ? "bg-[#26890c]/20" : "bg-[#e21b3c]/15"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />

                {/* Rank */}
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center">
                  {rank <= 3 ? (
                    <Award className={`h-7 w-7 ${
                      rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : "text-amber-700"
                    }`} />
                  ) : (
                    <span className="text-lg font-extrabold text-white/40">{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative z-10">
                  <Avatar value={player.playerEmoji} size={40} />
                </div>

                {/* Name + streak + points gained */}
                <div className="relative z-10 flex flex-1 flex-col min-w-0">
                  <span className="text-base font-extrabold text-white truncate sm:text-lg">
                    {player.playerName}
                  </span>
                  <div className="flex items-center gap-2">
                    {player.streak >= 2 && (
                      <span className="flex items-center gap-0.5 text-xs font-extrabold text-orange-400">
                        <Flame className="h-3.5 w-3.5" />
                        {player.streak}
                      </span>
                    )}
                    {player.correct && player.points > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-extrabold text-[#26890c]">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +{player.points}
                      </span>
                    )}
                    {!player.correct && (
                      <span className="text-xs font-bold text-[#e21b3c]/70">0</span>
                    )}
                  </div>
                </div>

                {/* Total score */}
                <span className="relative z-10 text-xl font-black text-white sm:text-2xl">
                  {player.totalScore}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Team scores */}
      {results.teamScores && results.teamScores.length > 0 && (
        <div className="flex gap-3 justify-center">
          {results.teamScores.map((ts) => (
            <div key={ts.teamIndex} className="flex items-center gap-2 rounded-xl glass px-4 py-2">
              <Users className="h-4 w-4 text-white/50" />
              <span className="text-sm font-bold text-white">{ts.teamName}</span>
              <span className="text-sm font-extrabold text-white">{ts.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* Wager results */}
      {results.wagerResults && results.wagerResults.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {results.wagerResults.map((wr) => (
            <div key={wr.playerId} className="flex items-center gap-2 rounded-xl glass px-4 py-2">
              <span className="text-sm font-bold text-white">{wr.playerName}</span>
              <span className={`text-lg font-extrabold ${wr.won ? "text-[#26890c]" : "text-[#e21b3c]"}`}>
                {wr.won ? "+" : ""}{wr.netPoints}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Power-up effects */}
      {results.powerUpEffects && results.powerUpEffects.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {results.powerUpEffects.map((pe, i) => (
            <span key={i} className="rounded-lg bg-cyan-500/20 px-3 py-1 text-sm font-bold text-cyan-300">
              <Zap className="mr-1 inline h-3.5 w-3.5" />
              {pe.playerName}: {pe.effect}
            </span>
          ))}
        </div>
      )}

      {/* Next question / Final results button */}
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
