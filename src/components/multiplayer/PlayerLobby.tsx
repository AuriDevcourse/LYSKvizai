import { Users, Loader2 } from "lucide-react";
import type { PlayerInfo } from "@/lib/multiplayer/types";
import Avatar from "@/components/Avatar";

interface PlayerLobbyProps {
  code: string;
  players: PlayerInfo[];
  playerName: string;
  playerEmoji: string;
}

export default function PlayerLobby({ code, players, playerName, playerEmoji }: PlayerLobbyProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <Avatar value={playerEmoji} size={64} />

      <h1 className="text-2xl font-bold text-white">Prisijungei!</h1>

      <p className="text-white/60">
        Kambarys <span className="font-bold text-white/80">{code}</span>
      </p>

      <div className="rounded-xl border-2 border-white/20 bg-white/5 px-6 py-4 text-center">
        <p className="text-lg font-bold text-white">{playerName}</p>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-white/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Laukiame pradžios...</span>
        </div>
      </div>

      <div className="w-full max-w-xs">
        <div className="mb-3 flex items-center justify-center gap-2 text-sm uppercase tracking-wider text-white/50">
          <Users className="h-4 w-4" />
          <span>Žaidėjai ({players.length})</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {players.map((p) => (
            <span
              key={p.id}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                p.name === playerName
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/60"
              }`}
            >
              <Avatar value={p.emoji} size={24} />
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
