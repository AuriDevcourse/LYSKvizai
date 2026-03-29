import { Users, Loader2 } from "lucide-react";
import type { PlayerInfo } from "@/lib/multiplayer/types";
import Avatar from "@/components/Avatar";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface PlayerLobbyProps {
  code: string;
  players: PlayerInfo[];
  playerName: string;
  playerEmoji: string;
}

export default function PlayerLobby({ code, players, playerName, playerEmoji }: PlayerLobbyProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      {/* Your avatar + name hero */}
      <div className="flex flex-col items-center gap-3 animate-bounce-in">
        <div className="rounded-full bg-white/5 p-1.5">
          <Avatar value={playerEmoji} size={88} />
        </div>
        <h1 className="text-3xl font-extrabold text-white">{playerName}</h1>
      </div>

      {/* Status */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-extrabold text-white/80">{t("playerLobby.youreIn")}</p>
        <div className="flex items-center gap-2 text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-bold">{t("playerLobby.waitingToStart")}</span>
        </div>
      </div>

      {/* Player list */}
      <div className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white/50">
          <Users className="h-4 w-4" />
          <span>{t("lobby.players")} ({players.length})</span>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col items-center gap-1 animate-fade-in-up ${
                p.name === playerName ? "opacity-100" : "opacity-70"
              }`}
            >
              <div className={`rounded-full p-0.5 ${p.name === playerName ? "outline outline-[1.5px] outline-[#ff9062]" : ""}`}>
                <Avatar value={p.emoji} size={40} />
              </div>
              <span className="max-w-[72px] text-center text-xs font-extrabold text-white truncate">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
