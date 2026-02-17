import { Users, Loader2 } from "lucide-react";
import type { PlayerInfo } from "@/lib/multiplayer/types";

interface PlayerLobbyProps {
  code: string;
  players: PlayerInfo[];
  playerName: string;
  playerEmoji: string;
}

export default function PlayerLobby({ code, players, playerName, playerEmoji }: PlayerLobbyProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <span className="text-5xl">{playerEmoji}</span>

      <h1 className="text-2xl font-bold text-amber-50">Prisijungei!</h1>

      <p className="text-amber-200/60">
        Kambarys <span className="font-bold text-amber-200">{code}</span>
      </p>

      <div className="rounded-xl border-2 border-amber-400/20 bg-amber-400/5 px-6 py-4 text-center">
        <p className="text-lg font-semibold text-amber-50">{playerName}</p>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-amber-200/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Laukiame pradžios...</span>
        </div>
      </div>

      <div className="w-full max-w-xs">
        <div className="mb-3 flex items-center justify-center gap-2 text-sm uppercase tracking-wider text-amber-200/50">
          <Users className="h-4 w-4" />
          <span>Žaidėjai ({players.length})</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {players.map((p) => (
            <span
              key={p.id}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                p.name === playerName
                  ? "bg-amber-400/20 text-amber-100"
                  : "bg-white/5 text-amber-200/60"
              }`}
            >
              <span className="text-base">{p.emoji}</span>
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
