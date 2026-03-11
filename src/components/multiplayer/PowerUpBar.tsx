"use client";

import { useState } from "react";
import { Snowflake, Shield, ChevronsUp } from "lucide-react";
import type { PowerUpType } from "@/lib/multiplayer/types";

interface PowerUpBarProps {
  usesLeft: number;
  usedTypes?: string[];
  onUse: (powerUp: PowerUpType) => void;
  disabled?: boolean;
}

const POWER_UPS: { type: PowerUpType; label: string; icon: typeof Snowflake; color: string; desc: string }[] = [
  { type: "freeze", label: "Freeze", icon: Snowflake, color: "bg-cyan-500 hover:bg-cyan-400", desc: "−3s timer" },
  { type: "shield", label: "Shield", icon: Shield, color: "bg-emerald-500 hover:bg-emerald-400", desc: "Protect streak" },
  { type: "double", label: "×2 Points", icon: ChevronsUp, color: "bg-[#d89e00] hover:bg-[#d89e00]/80", desc: "Double points" },
];

export default function PowerUpBar({ usesLeft, usedTypes = [], onUse, disabled }: PowerUpBarProps) {
  const [usedThisRound, setUsedThisRound] = useState(false);

  if (usesLeft <= 0 && !usedThisRound) return null;

  const roundDisabled = disabled || usedThisRound || usesLeft <= 0;

  return (
    <div className="w-full">
      <p className="mb-2 text-center text-xs font-bold text-white/40">
        Powers — {usesLeft} left
      </p>
      <div className="flex items-stretch justify-center gap-2">
        {POWER_UPS.map((pu) => {
          const Icon = pu.icon;
          const alreadyUsed = usedTypes.includes(pu.type);
          const btnDisabled = roundDisabled || alreadyUsed;
          return (
            <button
              key={pu.type}
              onClick={() => {
                if (btnDisabled) return;
                setUsedThisRound(true);
                onUse(pu.type);
              }}
              disabled={btnDisabled}
              className={`answer-btn flex flex-col items-center gap-1 rounded-xl px-4 py-2.5 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed ${pu.color}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-extrabold">{pu.label}</span>
              <span className="text-[10px] font-medium text-white/70">
                {alreadyUsed ? "Used" : pu.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
