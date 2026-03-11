"use client";

import { useState } from "react";
import { Swords, Users, Skull, Heart } from "lucide-react";
import type { GameMode } from "@/lib/multiplayer/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface GameModeSelectorProps {
  onSelect: (mode: GameMode, options: { teamCount?: number; eliminationInterval?: number }) => void;
}

const MODES = [
  {
    id: "classic" as GameMode,
    labelKey: "gameMode.classic" as const,
    descKey: "gameMode.classicDesc" as const,
    icon: Swords,
    color: "border-white/35 bg-white/10",
    activeColor: "border-white bg-white/20 ring-2 ring-white/30",
  },
  {
    id: "elimination" as GameMode,
    labelKey: "gameMode.elimination" as const,
    descKey: "gameMode.eliminationDesc" as const,
    icon: Skull,
    color: "border-red-400/50 bg-[#e21b3c]/20",
    activeColor: "border-red-400 bg-red-400/20 ring-2 ring-red-400/30",
  },
  {
    id: "team" as GameMode,
    labelKey: "gameMode.team" as const,
    descKey: "gameMode.teamDesc" as const,
    icon: Users,
    color: "border-blue-400/50 bg-blue-400/10",
    activeColor: "border-blue-400 bg-blue-400/20 ring-2 ring-blue-400/30",
  },
  {
    id: "survival" as GameMode,
    labelKey: "gameMode.survival" as const,
    descKey: "gameMode.survivalDesc" as const,
    icon: Heart,
    color: "border-pink-400/50 bg-pink-400/10",
    activeColor: "border-pink-400 bg-pink-400/20 ring-2 ring-pink-400/30",
  },
];

export default function GameModeSelector({ onSelect }: GameModeSelectorProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<GameMode>("classic");
  const [teamCount, setTeamCount] = useState(2);
  const [eliminationInterval, setEliminationInterval] = useState(3);

  const handleConfirm = () => {
    onSelect(selected, {
      teamCount: selected === "team" ? teamCount : undefined,
      eliminationInterval: selected === "elimination" ? eliminationInterval : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-center text-sm font-medium text-white/60">{t("gameMode.title")}</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = selected === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setSelected(mode.id)}
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
                onClick={() => setTeamCount(n)}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                  teamCount === n
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
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
                onClick={() => setEliminationInterval(n)}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                  eliminationInterval === n
                    ? "bg-red-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        className="rounded-xl bg-white text-[#46178f] px-6 py-3 font-bold transition-colors hover:bg-white/90"
      >
        {t("gameMode.select")}
      </button>
    </div>
  );
}
