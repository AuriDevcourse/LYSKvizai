"use client";

import { useState } from "react";
import { Swords, Users, Skull } from "lucide-react";
import type { GameMode } from "@/lib/multiplayer/types";

interface GameModeSelectorProps {
  onSelect: (mode: GameMode, options: { teamCount?: number; eliminationInterval?: number }) => void;
}

const MODES = [
  {
    id: "classic" as GameMode,
    label: "Klasikinis",
    description: "Visi žaidžia, daugiausiai taškų laimi",
    icon: Swords,
    color: "border-amber-400/50 bg-amber-400/10",
    activeColor: "border-amber-400 bg-amber-400/20 ring-2 ring-amber-400/30",
  },
  {
    id: "elimination" as GameMode,
    label: "Eliminacija",
    description: "Kas 3 raundus pašalinamas silpniausias",
    icon: Skull,
    color: "border-red-400/50 bg-red-400/10",
    activeColor: "border-red-400 bg-red-400/20 ring-2 ring-red-400/30",
  },
  {
    id: "team" as GameMode,
    label: "Komandinis",
    description: "Komandos varžosi, atsakinėja paeiliui",
    icon: Users,
    color: "border-blue-400/50 bg-blue-400/10",
    activeColor: "border-blue-400 bg-blue-400/20 ring-2 ring-blue-400/30",
  },
];

export default function GameModeSelector({ onSelect }: GameModeSelectorProps) {
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
      <h3 className="text-center text-sm font-medium text-amber-200/60">Žaidimo režimas</h3>

      <div className="grid gap-3">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = selected === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setSelected(mode.id)}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                isActive ? mode.activeColor : mode.color
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-white/60"}`} />
              <div>
                <p className={`text-sm font-bold ${isActive ? "text-white" : "text-white/80"}`}>
                  {mode.label}
                </p>
                <p className="text-xs text-white/50">{mode.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Team count option */}
      {selected === "team" && (
        <div className="rounded-xl border-2 border-blue-400/20 bg-blue-400/5 px-4 py-3">
          <label className="mb-2 block text-xs font-medium text-blue-200/60">
            Komandų skaičius
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
            Pašalinti kas N raundų
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
        className="rounded-xl bg-amber-500 px-6 py-3 font-bold text-amber-950 transition-colors hover:bg-amber-400"
      >
        Pasirinkti
      </button>
    </div>
  );
}
