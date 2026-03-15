"use client";

import { useState } from "react";
import { Coins, Flame } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface WagerScreenProps {
  currentScore: number;
  onSubmit: (amount: number) => void;
}

export default function WagerScreen({ currentScore, onSubmit }: WagerScreenProps) {
  const { t } = useTranslation();
  const maxWager = currentScore;
  const [amount, setAmount] = useState(0);
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
          className="rounded-xl bg-white text-[#46178f] px-8 py-3 font-bold transition-colors hover:bg-white/90"
        >
          {t("wager.continue")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <Coins className="h-12 w-12 text-white" />
      <h2 className="text-2xl font-extrabold text-white">{t("wager.roundExclaim")}</h2>

      <div className="rounded-xl border-2 border-white/20 bg-white/5 px-6 py-3 text-center">
        <p className="text-xs text-white/50">{t("wager.yourPoints")}</p>
        <p className="text-2xl font-extrabold text-white">{currentScore}</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {/* ALL IN */}
        <button
          onClick={() => handleSubmit(maxWager)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-400 bg-red-500/20 px-6 py-4 text-xl font-extrabold text-white transition-transform active:scale-[0.97]"
        >
          <Flame className="h-6 w-6 text-red-400" />
          ALL IN — {maxWager}
        </button>

        {/* Skip / don't wager */}
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
