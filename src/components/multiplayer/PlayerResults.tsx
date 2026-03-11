"use client";

import { CheckCircle, XCircle, Clock, Flame, Hash, Skull, Zap, Coins, Shield, Sparkles, Calendar } from "lucide-react";
import type { ResultsPayload } from "@/lib/multiplayer/types";
import ReactionPicker from "./ReactionPicker";

interface PlayerResultsProps {
  playerId: string;
  results: ResultsPayload;
  onReact?: (emoji: string) => void;
  children?: React.ReactNode;
}

export default function PlayerResults({ playerId, results, onReact, children }: PlayerResultsProps) {
  const myResult = results.playerResults.find((r) => r.playerId === playerId);

  const myRank = results.leaderboard.find((e) => e.playerId === playerId)?.rank;
  const wasEliminated = results.eliminatedThisRound?.some((el) => el.playerId === playerId);
  const fellForBluff = results.bluffVictims?.includes(myResult?.playerName ?? "");
  const myWager = results.wagerResults?.find((wr) => wr.playerId === playerId);
  const myPowerUp = results.powerUpEffects?.find((pe) => pe.playerId === playerId);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden w-full max-w-sm mx-auto px-4">
      {/* Eliminated announcement */}
      {wasEliminated && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-red-400/30 bg-[#e21b3c]/20 px-6 py-4">
          <Skull className="h-8 w-8 text-red-400" />
          <div>
            <p className="text-lg font-bold text-red-100">Eliminated!</p>
            <p className="text-sm text-red-200/60">You can watch the game</p>
          </div>
        </div>
      )}

      {/* Correct/Incorrect indicator */}
      {myResult ? (
        <div className="flex flex-col items-center gap-3">
          {myResult.correct ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#26890c]/20">
              <CheckCircle className="h-10 w-10 text-[#26890c]" />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-400/15">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-white">
            {myResult.correct ? "Correct!" : "Incorrect"}
          </h2>
          {myResult.correct && myResult.points > 0 && (
            <p className="text-lg font-bold text-emerald-300">
              +{myResult.points} pts
            </p>
          )}
          {myResult.streak >= 3 ? (
            <div className="flex items-center gap-1.5 text-sm font-bold text-orange-300">
              <Flame className="h-4 w-4 text-orange-400" />
              <span>Streak: {myResult.streak} in a row! +{Math.min((myResult.streak - 2) * 100, 500)} bonus</span>
            </div>
          ) : myResult.streak > 1 ? (
            <div className="flex items-center gap-1.5 text-sm text-white/60">
              <Flame className="h-4 w-4 text-orange-400" />
              <span>Streak: {myResult.streak} in a row!</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <Clock className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">No answer</h2>
        </div>
      )}

      {/* Mystery Multiplier reveal */}
      {results.mysteryMultiplier && results.mysteryMultiplier > 1 && (
        <div className="flex items-center gap-2 rounded-xl bg-[#d89e00]/20 px-5 py-3 animate-bounce-in">
          <Sparkles className="h-5 w-5 text-[#d89e00]" />
          <span className="text-lg font-extrabold text-[#d89e00]">
            Mystery x{results.mysteryMultiplier}!
          </span>
          {myResult?.correct && myResult.basePoints != null && (
            <span className="text-sm font-bold text-[#d89e00]/70">
              {myResult.basePoints} x {results.mysteryMultiplier} = {myResult.points}
            </span>
          )}
        </div>
      )}

      {/* Power-up effect */}
      {myPowerUp && (
        <div className="flex items-center gap-2 rounded-lg bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-300">
          {myPowerUp.powerUp === "shield" ? <Shield className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
          {myPowerUp.effect}
        </div>
      )}

      {/* Bluff victim */}
      {fellForBluff && (
        <div className="flex items-center gap-2 rounded-lg bg-purple-500/15 px-4 py-2 text-sm font-medium text-purple-300">
          <Zap className="h-4 w-4" />
          You fell for the bluff!
        </div>
      )}

      {/* Fastest Finger */}
      {results.fastestFinger && (
        <div className={`flex items-center gap-2 rounded-xl px-5 py-3 animate-bounce-in ${
          results.fastestFinger.playerId === playerId
            ? "border-2 border-[#d89e00] bg-[#d89e00]/20"
            : "bg-[#d89e00]/10"
        }`}>
          <Zap className="h-5 w-5 text-[#d89e00]" />
          <span className="text-base font-extrabold text-[#d89e00]">
            Fastest Finger: {results.fastestFinger.playerName} +{results.fastestFinger.bonusPoints} pts
          </span>
        </div>
      )}

      {/* Year Guesser result */}
      {results.yearGuesses && results.yearGuesses.length > 0 && (() => {
        const myGuess = results.yearGuesses!.find((g) => g.playerId === playerId);
        return (
          <div className="w-full rounded-xl glass px-5 py-4">
            <div className="flex items-center justify-center gap-2 text-sm font-extrabold text-white/60 mb-2">
              <Calendar className="h-4 w-4" />
              Year Guesser
            </div>
            <p className="text-center text-2xl font-extrabold text-[#26890c]">
              {results.yearGuesses![0].correctYear}
            </p>
            <p className="text-center text-xs font-bold text-white/50 mb-3">Correct year</p>
            {myGuess ? (
              <div className="text-center">
                <p className="text-lg font-extrabold text-white">
                  Your guess: {myGuess.guessedYear}
                </p>
                <p className="text-sm font-bold text-white/60">
                  {Math.abs(myGuess.guessedYear - myGuess.correctYear) === 0
                    ? "Exact!"
                    : `${Math.abs(myGuess.guessedYear - myGuess.correctYear)} year${Math.abs(myGuess.guessedYear - myGuess.correctYear) === 1 ? "" : "s"} off`}
                </p>
                <p className="text-base font-extrabold text-emerald-300 mt-1">
                  +{myGuess.points} pts
                </p>
              </div>
            ) : (
              <p className="text-center text-sm font-bold text-white/50">No guess submitted</p>
            )}
          </div>
        );
      })()}

      {/* Wager result */}
      {myWager && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
          myWager.won ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-white"
        }`}>
          <Coins className="h-4 w-4" />
          {myWager.won
            ? `Won the wager! +${myWager.netPoints} pts (wagered ${myWager.wager})`
            : `Lost the wager: ${myWager.netPoints} pts (wagered ${myWager.wager})`
          }
        </div>
      )}

      {/* Your rank */}
      {myRank && (
        <div className="rounded-xl border-2 border-white/20 bg-white/5 px-8 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-sm text-white/50">
            <Hash className="h-3.5 w-3.5" />
            <span>Your rank</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-white">
            #{myRank}
            <span className="ml-2 text-lg text-white/60">
              / {results.leaderboard.length}
            </span>
          </p>
          <p className="mt-1 text-sm font-medium text-white/80">
            {myResult?.totalScore ?? 0} pts
          </p>
        </div>
      )}

      {onReact && <ReactionPicker onReact={onReact} />}

      {children}

      {!children && (
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Clock className="h-3.5 w-3.5" />
          <span>Waiting for next question...</span>
        </div>
      )}
    </div>
  );
}
