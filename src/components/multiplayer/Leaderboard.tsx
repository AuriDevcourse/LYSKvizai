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
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10">
        <Trophy className="h-8 w-8 text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold text-amber-50 sm:text-3xl">Galutiniai rezultatai</h2>

      {/* Podium - top 3 */}
      <div className="flex w-full max-w-lg items-end justify-center gap-3">
        {/* 2nd place */}
        {top3[1] && (
          <div className="flex w-1/3 flex-col items-center">
            <Award className="h-7 w-7 text-gray-300" />
            <div
              className={`mt-2 flex w-full flex-col items-center rounded-t-xl px-2 py-4 ${
                top3[1].playerId === currentPlayerId
                  ? "bg-amber-400/20 ring-2 ring-amber-400"
                  : "bg-white/5"
              }`}
              style={{ minHeight: 80 }}
            >
              <span className="text-2xl">{top3[1].emoji}</span>
              <p className="mt-1 text-sm font-bold text-amber-50 text-center">{top3[1].name}</p>
              <p className="text-sm text-amber-200">{top3[1].score}</p>
            </div>
          </div>
        )}

        {/* 1st place */}
        {top3[0] && (
          <div className="flex w-1/3 flex-col items-center">
            <Crown className="h-8 w-8 text-amber-400" />
            <div
              className={`mt-2 flex w-full flex-col items-center rounded-t-xl px-2 py-6 ${
                top3[0].playerId === currentPlayerId
                  ? "bg-amber-400/20 ring-2 ring-amber-400"
                  : "bg-white/5"
              }`}
              style={{ minHeight: 100 }}
            >
              <span className="text-3xl">{top3[0].emoji}</span>
              <p className="mt-1 text-base font-bold text-amber-50 text-center">{top3[0].name}</p>
              <p className="text-lg font-bold text-amber-200">{top3[0].score}</p>
            </div>
          </div>
        )}

        {/* 3rd place */}
        {top3[2] && (
          <div className="flex w-1/3 flex-col items-center">
            <Medal className="h-6 w-6 text-amber-600" />
            <div
              className={`mt-2 flex w-full flex-col items-center rounded-t-xl px-2 py-3 ${
                top3[2].playerId === currentPlayerId
                  ? "bg-amber-400/20 ring-2 ring-amber-400"
                  : "bg-white/5"
              }`}
              style={{ minHeight: 60 }}
            >
              <span className="text-xl">{top3[2].emoji}</span>
              <p className="mt-1 text-sm font-bold text-amber-50 text-center">{top3[2].name}</p>
              <p className="text-sm text-amber-200">{top3[2].score}</p>
            </div>
          </div>
        )}
      </div>

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="flex w-full max-w-lg flex-col gap-1">
          {rest.map((entry) => (
            <div
              key={entry.playerId}
              className={`flex items-center justify-between rounded-lg px-4 py-2.5 ${
                entry.playerId === currentPlayerId
                  ? "bg-amber-400/15 ring-1 ring-amber-400/50"
                  : "bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="min-w-[2ch] text-right text-sm font-bold text-amber-400">
                  {entry.rank}.
                </span>
                <span className="text-lg">{entry.emoji}</span>
                <span className="font-medium text-amber-50">{entry.name}</span>
              </div>
              <span className="font-bold text-amber-200">{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
