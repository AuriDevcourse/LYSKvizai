"use client";

import { useState } from "react";
import { Snowflake, Shield, Zap } from "lucide-react";
import type { PowerUpType } from "@/lib/multiplayer/types";

interface PowerUpBarProps {
  usesLeft: number;
  onUse: (powerUp: PowerUpType) => void;
  disabled?: boolean;
}

const POWER_UPS: { type: PowerUpType; label: string; icon: typeof Snowflake; color: string; description: string }[] = [
  { type: "freeze", label: "Užšaldymas", icon: Snowflake, color: "bg-cyan-500 hover:bg-cyan-400", description: "-3s kitiems" },
  { type: "shield", label: "Skydas", icon: Shield, color: "bg-emerald-500 hover:bg-emerald-400", description: "Serija saugi" },
  { type: "double", label: "Dvigubai", icon: Zap, color: "bg-amber-500 hover:bg-amber-400", description: "2× taškai" },
];

export default function PowerUpBar({ usesLeft, onUse, disabled }: PowerUpBarProps) {
  const [usedThisRound, setUsedThisRound] = useState(false);

  if (usesLeft <= 0 && !usedThisRound) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-xs text-amber-200/40">Galios ({usesLeft}):</span>
      {POWER_UPS.map((pu) => {
        const Icon = pu.icon;
        const isDisabled = disabled || usedThisRound || usesLeft <= 0;
        return (
          <button
            key={pu.type}
            onClick={() => {
              if (isDisabled) return;
              setUsedThisRound(true);
              onUse(pu.type);
            }}
            disabled={isDisabled}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${pu.color}`}
            title={`${pu.label}: ${pu.description}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{pu.label}</span>
          </button>
        );
      })}
    </div>
  );
}
