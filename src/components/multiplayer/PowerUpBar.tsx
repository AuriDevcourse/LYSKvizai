"use client";

import { useState } from "react";
import { Snowflake, Shield, ChevronsUp } from "lucide-react";
import type { PowerUpType } from "@/lib/multiplayer/types";

interface PowerUpBarProps {
  usesLeft: number;
  onUse: (powerUp: PowerUpType) => void;
  disabled?: boolean;
}

const POWER_UPS: { type: PowerUpType; label: string; icon: typeof Snowflake; color: string; desc: string }[] = [
  { type: "freeze", label: "Užšaldymas", icon: Snowflake, color: "bg-cyan-500 hover:bg-cyan-400", desc: "−3s laikmačiui" },
  { type: "shield", label: "Skydas", icon: Shield, color: "bg-emerald-500 hover:bg-emerald-400", desc: "Apsaugo seriją" },
  { type: "double", label: "×2 Taškai", icon: ChevronsUp, color: "bg-[#d89e00] hover:bg-[#d89e00]/80", desc: "Dvigubi taškai" },
];

export default function PowerUpBar({ usesLeft, onUse, disabled }: PowerUpBarProps) {
  const [usedThisRound, setUsedThisRound] = useState(false);

  if (usesLeft <= 0 && !usedThisRound) return null;

  const isDisabled = disabled || usedThisRound || usesLeft <= 0;

  return (
    <div className="w-full">
      <p className="mb-2 text-center text-xs font-bold text-white/40">
        Galios — {usesLeft} liko
      </p>
      <div className="flex items-stretch justify-center gap-2">
        {POWER_UPS.map((pu) => {
          const Icon = pu.icon;
          return (
            <button
              key={pu.type}
              onClick={() => {
                if (isDisabled) return;
                setUsedThisRound(true);
                onUse(pu.type);
              }}
              disabled={isDisabled}
              className={`answer-btn flex flex-col items-center gap-1 rounded-xl px-4 py-2.5 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed ${pu.color}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-extrabold">{pu.label}</span>
              <span className="text-[10px] font-medium text-white/70">{pu.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
