import { Users, Loader2, Swords, Skull, ListOrdered } from "lucide-react";
import type { PlayerInfo, GameMode } from "@/lib/multiplayer/types";
import Avatar from "@/components/Avatar";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface PlayerLobbyProps {
  code: string;
  players: PlayerInfo[];
  playerName: string;
  playerEmoji: string;
  /** What kind of game is about to start. */
  gameMode?: GameMode;
  /** How many questions are coming. */
  totalQuestions?: number;
  teamNames?: string[];
  /** Which team this player has been put on, if any. */
  myTeamIndex?: number | null;
}

const MODE_LABEL: Record<GameMode, { label: string; icon: typeof Swords }> = {
  classic: { label: "Classic", icon: Swords },
  elimination: { label: "Elimination", icon: Skull },
  team: { label: "Teams", icon: Users },
};

export default function PlayerLobby({
  // Unused: the room code is shown by the parent, not here. Kept in the
  // props because callers pass it and the shape is shared.
  code: _code,
  players,
  playerName,
  playerEmoji,
  gameMode = "classic",
  totalQuestions = 0,
  teamNames = [],
  myTeamIndex = null,
}: PlayerLobbyProps) {
  const { t } = useTranslation();
  const mode = MODE_LABEL[gameMode] ?? MODE_LABEL.classic;
  const ModeIcon = mode.icon;
  const myTeam = myTeamIndex != null ? teamNames[myTeamIndex] : undefined;
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

        {/* What you're actually waiting for. The lobby used to say nothing
            about the game — not the mode, not the length, not your team — so
            the first thing a player learned was whatever question one was. */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
            <ModeIcon className="h-3.5 w-3.5" />
            {mode.label}
          </span>
          {totalQuestions > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
              <ListOrdered className="h-3.5 w-3.5" />
              {totalQuestions} questions
            </span>
          )}
          {myTeam && (
            <span className="flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1.5 text-xs font-extrabold text-primary">
              <Users className="h-3.5 w-3.5" />
              {myTeam}
            </span>
          )}
        </div>
      </div>

      {/* Player list */}
      <div className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white/50">
          <Users className="h-4 w-4" />
          <span>{t("lobby.players")} ({players.length})</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col items-center gap-1 animate-fade-in-up w-16 ${
                p.name === playerName ? "opacity-100" : "opacity-70"
              }`}
            >
              <div className={`rounded-full p-0.5 ${p.name === playerName ? "outline outline-[1.5px] outline-primary" : ""}`}>
                <Avatar value={p.emoji} size={40} />
              </div>
              <span className={`w-full text-center font-extrabold text-white leading-tight break-words ${
                p.name.length > 8 ? "text-[10px]" : "text-xs"
              }`}>
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
