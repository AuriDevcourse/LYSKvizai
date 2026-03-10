import { Trophy, Crown, Award, Medal } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/multiplayer/types";

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentPlayerId?: string;
}

export default function Leaderboard({ leaderboard, currentPlayerId }: LeaderboardProps) {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="flex w-full flex-col items-center gap-6 animate-fade-in-up">
      <Trophy className="h-12 w-12 text-[#d89e00] animate-bounce-in" />
      <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Rezultatai</h2>

      {/* Podium - top 3 */}
      <div className="flex w-full max-w-lg items-end justify-center gap-3 stagger-children">
        {/* 2nd place */}
        {top3[1] && (
          <div className="flex w-1/3 flex-col items-center">
            <Award className="h-7 w-7 text-gray-300" />
            <div
              className={`mt-2 flex w-full flex-col items-center rounded-t-2xl px-2 py-4 ${
                top3[1].playerId === currentPlayerId
                  ? "bg-white/20 ring-2 ring-white"
                  : "glass"
              }`}
              style={{ minHeight: 80 }}
            >
              <span className="text-2xl">{top3[1].emoji}</span>
              <p className="mt-1 text-sm font-extrabold text-white text-center">{top3[1].name}</p>
              <p className="text-sm font-bold text-white/60">{top3[1].score}</p>
            </div>
          </div>
        )}

        {/* 1st place */}
        {top3[0] && (
          <div className="flex w-1/3 flex-col items-center">
            <Crown className="h-8 w-8 text-[#d89e00]" />
            <div
              className={`mt-2 flex w-full flex-col items-center rounded-t-2xl px-2 py-6 ${
                top3[0].playerId === currentPlayerId
                  ? "bg-white/20 ring-2 ring-white"
                  : "glass"
              }`}
              style={{ minHeight: 100 }}
            >
              <span className="text-3xl">{top3[0].emoji}</span>
              <p className="mt-1 text-base font-extrabold text-white text-center">{top3[0].name}</p>
              <p className="text-lg font-extrabold text-[#d89e00]">{top3[0].score}</p>
            </div>
          </div>
        )}

        {/* 3rd place */}
        {top3[2] && (
          <div className="flex w-1/3 flex-col items-center">
            <Medal className="h-6 w-6 text-amber-700" />
            <div
              className={`mt-2 flex w-full flex-col items-center rounded-t-2xl px-2 py-3 ${
                top3[2].playerId === currentPlayerId
                  ? "bg-white/20 ring-2 ring-white"
                  : "glass"
              }`}
              style={{ minHeight: 60 }}
            >
              <span className="text-xl">{top3[2].emoji}</span>
              <p className="mt-1 text-sm font-extrabold text-white text-center">{top3[2].name}</p>
              <p className="text-sm font-bold text-white/60">{top3[2].score}</p>
            </div>
          </div>
        )}
      </div>

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="flex w-full max-w-lg flex-col gap-1 stagger-children">
          {rest.map((entry) => (
            <div
              key={entry.playerId}
              className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                entry.playerId === currentPlayerId
                  ? "bg-white/15 ring-1 ring-white/50"
                  : "glass"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="min-w-[2ch] text-right text-sm font-extrabold text-white/50">
                  {entry.rank}.
                </span>
                <span className="text-lg">{entry.emoji}</span>
                <span className="font-bold text-white">{entry.name}</span>
              </div>
              <span className="font-extrabold text-white">{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
