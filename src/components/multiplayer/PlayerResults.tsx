"use client";

import { useEffect, useRef } from "react";
import { CheckCircle, XCircle, Clock, Flame, Hash, Skull, Zap, Coins, Shield } from "lucide-react";
import type { ResultsPayload } from "@/lib/multiplayer/types";
import { useSound } from "@/hooks/useSound";
import ReactionPicker from "./ReactionPicker";

interface PlayerResultsProps {
  playerId: string;
  results: ResultsPayload;
  onReact?: (emoji: string) => void;
}

export default function PlayerResults({ playerId, results, onReact }: PlayerResultsProps) {
  const { playCorrect, playWrong } = useSound();
  const soundPlayedRef = useRef(false);
  const myResult = results.playerResults.find((r) => r.playerId === playerId);

  useEffect(() => {
    if (soundPlayedRef.current) return;
    soundPlayedRef.current = true;
    if (myResult?.correct) playCorrect();
    else if (myResult && !myResult.correct) playWrong();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const myRank = results.leaderboard.find((e) => e.playerId === playerId)?.rank;
  const wasEliminated = results.eliminatedThisRound?.some((el) => el.playerId === playerId);
  const fellForBluff = results.bluffVictims?.includes(myResult?.playerName ?? "");
  const myWager = results.wagerResults?.find((wr) => wr.playerId === playerId);
  const myPowerUp = results.powerUpEffects?.find((pe) => pe.playerId === playerId);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      {/* Eliminated announcement */}
      {wasEliminated && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-red-400/30 bg-red-400/10 px-6 py-4">
          <Skull className="h-8 w-8 text-red-400" />
          <div>
            <p className="text-lg font-bold text-red-100">Pašalintas!</p>
            <p className="text-sm text-red-200/60">Galite stebėti žaidimą</p>
          </div>
        </div>
      )}

      {/* Correct/Incorrect indicator */}
      {myResult ? (
        <div className="flex flex-col items-center gap-3">
          {myResult.correct ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-400/15">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-amber-50">
            {myResult.correct ? "Teisingai!" : "Neteisingai"}
          </h2>
          {myResult.correct && myResult.points > 0 && (
            <p className="text-lg font-semibold text-emerald-300">
              +{myResult.points} tšk.
            </p>
          )}
          {myResult.streak >= 3 ? (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-300">
              <Flame className="h-4 w-4 text-orange-400" />
              <span>Serija: {myResult.streak} iš eilės! +{Math.min((myResult.streak - 2) * 100, 500)} bonus</span>
            </div>
          ) : myResult.streak > 1 ? (
            <div className="flex items-center gap-1.5 text-sm text-amber-200/60">
              <Flame className="h-4 w-4 text-orange-400" />
              <span>Serija: {myResult.streak} iš eilės!</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/10">
            <Clock className="h-10 w-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-amber-50">Neatsakėte</h2>
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
          Patikėjai apgaule!
        </div>
      )}

      {/* Wager result */}
      {myWager && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
          myWager.won ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
        }`}>
          <Coins className="h-4 w-4" />
          {myWager.won
            ? `Laimėjote statymą! +${myWager.netPoints} tšk. (statėte ${myWager.wager})`
            : `Pralaimėjote statymą: ${myWager.netPoints} tšk. (statėte ${myWager.wager})`
          }
        </div>
      )}

      {/* Your rank */}
      {myRank && (
        <div className="rounded-xl border-2 border-amber-400/20 bg-amber-400/5 px-8 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-sm text-amber-200/50">
            <Hash className="h-3.5 w-3.5" />
            <span>Tavo vieta</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-amber-50">
            #{myRank}
            <span className="ml-2 text-lg text-amber-200/60">
              / {results.leaderboard.length}
            </span>
          </p>
          <p className="mt-1 text-sm font-medium text-amber-200">
            {myResult?.totalScore ?? 0} tšk.
          </p>
        </div>
      )}

      {onReact && <ReactionPicker onReact={onReact} />}

      <div className="flex items-center gap-2 text-sm text-amber-200/40">
        <Clock className="h-3.5 w-3.5" />
        <span>Laukiame kito klausimo...</span>
      </div>
    </div>
  );
}
