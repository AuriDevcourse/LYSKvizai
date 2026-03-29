"use client";

import { useState } from "react";
import { Coins, Flame } from "lucide-react";
import type { WagerType } from "@/lib/multiplayer/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface WagerScreenProps {
  currentScore: number;
  onSubmit: (amount: number) => void;
  wagerType?: WagerType;
}

export default function WagerScreen({ currentScore, onSubmit, wagerType = "regular" }: WagerScreenProps) {
  const { t } = useTranslation();
  const maxWager = Math.floor(currentScore * 0.3);
  const [amount, setAmount] = useState(Math.round(maxWager / 2));
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (val: number) => {
    setSubmitted(true);
    setAmount(val);
    onSubmit(Math.max(0, Math.min(val, maxWager)));
  };

  if (submitted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Coins className="h-12 w-12 text-white" />
        <p className="text-lg font-bold text-white">{t("wager.accepted")}</p>
        <p className="text-white/50">{t("wager.youWagered")} {amount} {t("wager.pts")}</p>
        <p className="text-sm text-white/40">{t("wager.waitingForOthers")}</p>
      </div>
    );
  }

  if (maxWager <= 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Coins className="h-12 w-12 text-white/50" />
        <p className="text-lg font-bold text-white">{t("wager.round")}</p>
        <p className="text-white/50">{t("wager.noPoints")}</p>
        <button
          onClick={() => handleSubmit(0)}
          className="rounded-xl bg-white text-[#ff9062] px-8 py-3 font-bold transition-colors hover:bg-white/90"
        >
          {t("wager.continue")}
        </button>
      </div>
    );
  }

  // ===== SUPER WAGER: All-in or skip =====
  if (wagerType === "super") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <Flame className="h-14 w-14 text-red-400" />
        <h2 className="text-2xl font-extrabold text-white">SUPER WAGER</h2>

        <div className="rounded-xl border-2 border-white/20 bg-white/5 px-6 py-3 text-center">
          <p className="text-xs text-white/50">{t("wager.yourPoints")}</p>
          <p className="text-2xl font-extrabold text-white">{currentScore}</p>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={() => handleSubmit(maxWager)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-400 bg-red-500/20 px-6 py-4 text-xl font-extrabold text-white transition-transform active:scale-[0.97]"
          >
            <Flame className="h-6 w-6 text-red-400" />
            ALL IN — {maxWager}
          </button>

          <button
            onClick={() => handleSubmit(0)}
            className="flex w-full items-center justify-center rounded-2xl border-2 border-white/20 bg-white/5 px-6 py-4 text-lg font-extrabold text-white/60 transition-transform active:scale-[0.97]"
          >
            {t("wager.skip")}
          </button>
        </div>
      </div>
    );
  }

  // ===== REGULAR WAGER: Pick any amount =====
  const presets = [
    Math.round(maxWager * 0.25),
    Math.round(maxWager * 0.5),
    Math.round(maxWager * 0.75),
    maxWager,
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      <Coins className="h-12 w-12 text-[#d89e00]" />
      <h2 className="text-2xl font-extrabold text-white">{t("wager.roundExclaim")}</h2>

      <div className="rounded-xl border-2 border-white/20 bg-white/5 px-6 py-3 text-center">
        <p className="text-xs text-white/50">{t("wager.yourPoints")}</p>
        <p className="text-2xl font-extrabold text-white">{currentScore}</p>
      </div>

      {/* Amount display */}
      <div className="text-center">
        <p className="text-4xl font-black text-[#d89e00] tabular-nums">{amount}</p>
      </div>

      {/* Slider */}
      <div className="w-full max-w-xs px-2">
        <input
          type="range"
          min={0}
          max={maxWager}
          step={Math.max(1, Math.round(maxWager / 100))}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-[#d89e00]"
        />
      </div>

      {/* Quick presets */}
      <div className="flex gap-2">
        {presets.map((val, i) => (
          <button
            key={i}
            onClick={() => setAmount(val)}
            className={`rounded-xl px-3 py-1.5 text-sm font-bold transition-colors ${
              amount === val
                ? "bg-[#d89e00] text-white"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {i === 3 ? "MAX" : `${(i + 1) * 25}%`}
          </button>
        ))}
      </div>

      {/* Submit */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={() => handleSubmit(amount)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d89e00] px-6 py-4 text-xl font-extrabold text-white transition-transform active:scale-[0.97]"
        >
          <Coins className="h-5 w-5" />
          {amount > 0 ? `${t("wager.wager")} ${amount}` : t("wager.skip")}
        </button>
      </div>
    </div>
  );
}
