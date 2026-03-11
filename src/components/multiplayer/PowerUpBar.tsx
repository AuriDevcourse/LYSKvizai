"use client";

import { useState } from "react";
import { Snowflake, Shield, ChevronsUp } from "lucide-react";
import type { PowerUpType } from "@/lib/multiplayer/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface PowerUpBarProps {
  usesLeft: number;
  usedTypes?: string[];
  onUse: (powerUp: PowerUpType) => void;
  disabled?: boolean;
}

const POWER_UPS: { type: PowerUpType; labelKey: "powerUp.freeze" | "powerUp.shield" | "powerUp.double"; icon: typeof Snowflake; color: string; descKey: "powerUp.freezeDesc" | "powerUp.shieldDesc" | "powerUp.doubleDesc" }[] = [
  { type: "freeze", labelKey: "powerUp.freeze", icon: Snowflake, color: "bg-cyan-500 hover:bg-cyan-400", descKey: "powerUp.freezeDesc" },
  { type: "shield", labelKey: "powerUp.shield", icon: Shield, color: "bg-emerald-500 hover:bg-emerald-400", descKey: "powerUp.shieldDesc" },
  { type: "double", labelKey: "powerUp.double", icon: ChevronsUp, color: "bg-[#d89e00] hover:bg-[#d89e00]/80", descKey: "powerUp.doubleDesc" },
];

export default function PowerUpBar({ usesLeft, usedTypes = [], onUse, disabled }: PowerUpBarProps) {
  const { t } = useTranslation();
  const [usedThisRound, setUsedThisRound] = useState(false);

  if (usesLeft <= 0 && !usedThisRound) return null;

  const roundDisabled = disabled || usedThisRound || usesLeft <= 0;

  return (
    <div className="w-full">
      <p className="mb-2 text-center text-xs font-bold text-white/40">
        {t("powerUp.powers")} — {usesLeft} {t("powerUp.left")}
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
              <span className="text-xs font-extrabold">{t(pu.labelKey)}</span>
              <span className="text-[10px] font-medium text-white/70">
                {t(pu.descKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
