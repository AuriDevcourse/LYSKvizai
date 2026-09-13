"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, Clock, Flame, Skull, Zap, TrendingDown, Eye, ChevronUp, ChevronDown, Check } from "lucide-react";
import type { ResultsPayload, QuestionPayload } from "@/lib/multiplayer/types";
import ReactionPicker from "./ReactionPicker";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { ANSWER_BG, ANSWER_TEXT } from "@/lib/answer-options";
import { formatHeight } from "@/lib/games/scale-scoring";
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
  /** Tap handler for "I'm ready"; when set, the ready control replaces the plain
   * "waiting" footer. */
  onReady?: () => void;
  /** Whether this player has already tapped ready this round. */
  iReadied?: boolean;
  /** Live "x of n players ready" for the results screen. */
  readyProgress?: { count: number; total: number } | null;
}

export default function PlayerResults({ playerId, results, question, onReact, children, eliminated = false, onReady, iReadied = false, readyProgress = null }: PlayerResultsProps) {
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

  const myScaleGuess = results.scaleGuesses?.find((g) => g.playerId === playerId);

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

      {/* Scale reveal: your size against the real one. The host screen draws
          the pair; this is the number you personally landed on, which is the
          part a player wants on their own phone. */}
      {results.scale && (
        <div className="w-full rounded-2xl bg-white/5 px-4 py-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-white/45">You said</p>
          <p className="font-headline text-3xl font-extrabold tabular-nums text-primary">
            {myScaleGuess ? formatHeight(myScaleGuess.guessedM) : "no guess"}
          </p>
          {myScaleGuess && (
            <>
              <p className="mt-1 text-sm font-bold text-white/70">
                Really {formatHeight(myScaleGuess.actualM)} · {myScaleGuess.verdict}
              </p>
              <p className="mt-0.5 text-xs font-bold tabular-nums text-white/45">
                {myScaleGuess.accuracy.toFixed(1)}% accurate
              </p>
            </>
          )}
        </div>
      )}

      {/* Correct answer reveal */}
      {options && !results.scale && (
        <div className="w-full">
          <div className={`grid gap-2 ${options.filter(o => o !== "").length <= 2 ? "grid-cols-2 max-w-xs mx-auto" : "grid-cols-2"}`}>
            {options.map((option, i) => {
              if (option === "") return null;
              const isCorrect = i === correctIndex;
              return (
                <div
                  key={i}
                  /* Near-black on the answer colours, never white. White
                     measures 2.30-2.68:1 against the four of them and
                     `ANSWER_TEXT` measures 7.20-8.38:1. The wrong answers still
                     recede: the whole tile drops to 40% rather than the text
                     being painted a fainter white. */
                  className={`rounded-xl px-3 py-2.5 text-center text-sm font-bold transition-all ${
                    isCorrect
                      ? `${ANSWER_COLORS[i]} ${ANSWER_TEXT} outline outline-[1.5px] outline-primary`
                      : `${ANSWER_COLORS[i]} ${ANSWER_TEXT} opacity-40`
                  }`}
                >
                  {option}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ready-to-advance. Every connected player must tap this before the next
          question starts, so nobody is dropped onto a fresh question mid-tap. */}
      {onReady ? (
        eliminated ? (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Clock className="h-3.5 w-3.5" />
            <span>{t("playerResults.waitingForNext")}</span>
          </div>
        ) : iReadied ? (
          <div className="flex w-full flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
              <Check className="h-4 w-4" />
              <span>You&apos;re ready</span>
            </div>
            {readyProgress && (
              <p className="text-xs font-bold text-white/45">
                Waiting for others · {readyProgress.count}/{readyProgress.total} ready
              </p>
            )}
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-2">
            <button
              onClick={onReady}
              className="btn-primary flex min-h-[52px] w-full items-center justify-center gap-2 text-lg"
            >
              <Check className="h-5 w-5" />
              I&apos;m ready
            </button>
            {readyProgress && readyProgress.count > 0 && (
              <p className="text-xs font-bold text-white/45">
                {readyProgress.count}/{readyProgress.total} ready
              </p>
            )}
          </div>
        )
      ) : (
        <>
          {children}
          {!children && (
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Clock className="h-3.5 w-3.5" />
              <span>{t("playerResults.waitingForNext")}</span>
            </div>
          )}
        </>
      )}

      {/* Reactions sit below the ready button, not above it.
          Wedged between the answer reveal and the CTA, the comment field was a
          text input directly above the one button everybody needs to tap, on a
          390px screen, with a keyboard opening over the rest of the screen when
          it took focus. Reacting is optional and the ready tap is not, so the
          optional thing goes last and gets a rule to sit behind. */}
      {onReact && (
        <div className="w-full border-t border-white/8 pt-4">
          <ReactionPicker onReact={onReact} />
        </div>
      )}
    </div>
  );
}
