"use client";

import { useState, useEffect } from "react";
import { Trophy, Crown, Award, Medal } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/multiplayer/types";
import Avatar from "@/components/Avatar";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentPlayerId?: string;
}

export default function Leaderboard({ leaderboard, currentPlayerId }: LeaderboardProps) {
  const { t } = useTranslation();
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Dramatic reveal: 3rd → 2nd → 1st
  const [revealStep, setRevealStep] = useState(0);

  useEffect(() => {
    // Step 0: nothing shown
    // Step 1: 3rd place (after 600ms)
    // Step 2: 2nd place (after 1800ms)
    // Step 3: 1st place (after 3000ms)
    // Step 4: rest of leaderboard (after 4000ms)
    const timers = [
      setTimeout(() => setRevealStep(1), 600),
      setTimeout(() => setRevealStep(2), 1800),
      setTimeout(() => setRevealStep(3), 3000),
      setTimeout(() => setRevealStep(4), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const isMe = (id: string) => id === currentPlayerId;

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Trophy icon */}
      <Trophy className="h-12 w-12 text-[#d89e00] animate-bounce-in" />
      <h2 className="text-3xl font-extrabold text-white sm:text-4xl animate-fade-in-up">
        {t("leaderboard.finalResults")}
      </h2>

      {/* Podium */}
      <div className="flex w-full max-w-xs items-end justify-center gap-2 mt-2 sm:max-w-lg sm:gap-3">
        {/* 2nd place */}
        <div className="flex w-1/3 flex-col items-center" style={{ opacity: revealStep >= 2 ? 1 : 0, transition: "opacity 0.5s" }}>
          {top3[1] && (
            <>
              <Award className="h-7 w-7 text-gray-300 animate-bounce-in" />
              <div
                className={`mt-2 flex w-full flex-col items-center rounded-t-2xl px-2 py-4 animate-fade-in-up ${
                  isMe(top3[1].playerId) ? "bg-white/20 outline outline-2 outline-white" : "glass"
                }`}
                style={{ minHeight: 100 }}
              >
                <div className="text-2xl font-extrabold text-gray-300 mb-1">2</div>
                <Avatar value={top3[1].emoji} size={40} />
                <p className="mt-1.5 text-sm font-extrabold text-white text-center truncate w-full">{top3[1].name}</p>
                <p className="text-lg font-extrabold text-white/70">{top3[1].score}</p>
              </div>
            </>
          )}
        </div>

        {/* 1st place */}
        <div className="flex w-1/3 flex-col items-center" style={{ opacity: revealStep >= 3 ? 1 : 0, transition: "opacity 0.5s" }}>
          {top3[0] && (
            <>
              <Crown className="h-9 w-9 text-[#d89e00] animate-bounce-in" />
              <div
                className={`mt-2 flex w-full flex-col items-center rounded-t-2xl px-2 py-6 animate-fade-in-up ${
                  isMe(top3[0].playerId) ? "bg-white/20 outline outline-2 outline-white" : "glass"
                }`}
                style={{ minHeight: 130 }}
              >
                <div className="text-3xl font-extrabold text-[#d89e00] mb-1">1</div>
                <Avatar value={top3[0].emoji} size={52} />
                <p className="mt-1.5 text-base font-extrabold text-white text-center truncate w-full">{top3[0].name}</p>
                <p className="text-xl font-extrabold text-[#d89e00]">{top3[0].score}</p>
              </div>
            </>
          )}
        </div>

        {/* 3rd place */}
        <div className="flex w-1/3 flex-col items-center" style={{ opacity: revealStep >= 1 ? 1 : 0, transition: "opacity 0.5s" }}>
          {top3[2] && (
            <>
              <Medal className="h-6 w-6 text-amber-700 animate-bounce-in" />
              <div
                className={`mt-2 flex w-full flex-col items-center rounded-t-2xl px-2 py-3 animate-fade-in-up ${
                  isMe(top3[2].playerId) ? "bg-white/20 outline outline-2 outline-white" : "glass"
                }`}
                style={{ minHeight: 70 }}
              >
                <div className="text-xl font-extrabold text-amber-700 mb-1">3</div>
                <Avatar value={top3[2].emoji} size={36} />
                <p className="mt-1 text-sm font-extrabold text-white text-center truncate w-full">{top3[2].name}</p>
                <p className="text-sm font-bold text-white/60">{top3[2].score}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div
          className="flex w-full max-w-lg flex-col gap-1 stagger-children"
          style={{ opacity: revealStep >= 4 ? 1 : 0, transition: "opacity 0.5s" }}
        >
          {rest.map((entry) => (
            <div
              key={entry.playerId}
              className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                isMe(entry.playerId)
                  ? "bg-white/15 ring-1 ring-white/50"
                  : "glass"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="min-w-[2ch] text-right text-sm font-extrabold text-white/50">
                  {entry.rank}.
                </span>
                <Avatar value={entry.emoji} size={28} />
                <span className="font-bold text-white truncate">{entry.name}</span>
              </div>
              <span className="font-extrabold text-white">{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
