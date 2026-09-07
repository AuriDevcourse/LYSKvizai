"use client";

import { useState } from "react";
import { Swords, Users, Skull } from "lucide-react";
import type { GameMode } from "@/lib/multiplayer/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface GameModeSelectorProps {
  onSelect: (mode: GameMode, options: { teamCount?: number; eliminationInterval?: number }) => void;
}

const MODES = [
  {
    id: "classic" as GameMode,
    labelKey: "gameMode.classic" as const,
    icon: Swords,
    color: "border-white/35 bg-white/5",
    activeColor: "border-white bg-white/20 outline outline-[1.5px] outline-primary/30",
  },
  {
    id: "elimination" as GameMode,
    labelKey: "gameMode.elimination" as const,
    icon: Skull,
    color: "border-red-400/50 bg-error/20",
    activeColor: "border-red-400 bg-red-400/20 ring-2 ring-red-400/30",
  },
  {
    id: "team" as GameMode,
    labelKey: "gameMode.team" as const,
    icon: Users,
    color: "border-blue-400/50 bg-blue-400/10",
    activeColor: "border-blue-400 bg-blue-400/20 ring-2 ring-blue-400/30",
  },
];

export default function GameModeSelector({ onSelect }: GameModeSelectorProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<GameMode>("classic");
  const [teamCount, setTeamCount] = useState(2);
  const [eliminationInterval, setEliminationInterval] = useState(3);

  const handleConfirm = (mode: GameMode = selected) => {
    onSelect(mode, {
      teamCount: mode === "team" ? teamCount : undefined,
      eliminationInterval: mode === "elimination" ? eliminationInterval : undefined,
    });
  };

  const handlePick = (mode: GameMode) => {
    setSelected(mode);
    /*
     * Commit on every pick, not just Classic.
     *
     * Elimination and Team used to require the separate `Select` tap, which
     * was safe only because that tap also advanced to the next screen — you
     * could not proceed without it. Now that the mode picker shares a screen
     * with the presentation choice, nothing forces it: picking Elimination and
     * then pressing "Big screen" recorded no mode at all and silently started
     * a Classic game.
     *
     * Committing here means the mode is always recorded. The option controls
     * below re-commit when changed, so the count or interval is never stale.
     */
    handleConfirm(mode);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = selected === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => handlePick(mode.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-all ${
                isActive ? mode.activeColor : mode.color
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "text-white" : "text-white/60"}`} />
              <p className={`text-sm font-bold ${isActive ? "text-white" : "text-white/80"}`}>
                {t(mode.labelKey)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Team count option */}
      {selected === "team" && (
        <div className="rounded-xl border-2 border-blue-400/20 bg-blue-400/5 px-4 py-3">
          <label className="mb-2 block text-xs font-medium text-blue-200/60">
            {t("gameMode.numberOfTeams")}
          </label>
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { setTeamCount(n); onSelect("team", { teamCount: n }); }}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                  teamCount === n
                    ? "bg-blue-500 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/20"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Elimination interval option */}
      {selected === "elimination" && (
        <div className="rounded-xl border-2 border-red-400/20 bg-red-400/5 px-4 py-3">
          <label className="mb-2 block text-xs font-medium text-red-200/60">
            {t("gameMode.eliminateEvery")}
          </label>
          <div className="flex gap-2">
            {[2, 3, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { setEliminationInterval(n); onSelect("elimination", { eliminationInterval: n }); }}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                  eliminationInterval === n
                    ? "bg-red-500 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/20"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}
