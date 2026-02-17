"use client";

import { useState } from "react";
import { Coins } from "lucide-react";

interface WagerScreenProps {
  currentScore: number;
  onSubmit: (amount: number) => void;
}

const PRESETS = [100, 200, 300, 500];

export default function WagerScreen({ currentScore, onSubmit }: WagerScreenProps) {
  const maxWager = Math.min(500, currentScore);
  const [amount, setAmount] = useState(Math.min(100, maxWager));
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit(Math.max(0, Math.min(amount, maxWager)));
  };

  if (submitted) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Coins className="h-12 w-12 text-amber-400" />
        <p className="text-lg font-semibold text-amber-50">Statymas priimtas!</p>
        <p className="text-amber-200/50">Statėte {amount} tšk.</p>
        <p className="text-sm text-amber-200/40">Laukiame kitų žaidėjų...</p>
      </div>
    );
  }

  if (maxWager <= 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Coins className="h-12 w-12 text-amber-400/50" />
        <p className="text-lg font-semibold text-amber-50">Statymų raundas</p>
        <p className="text-amber-200/50">Neturite taškų statyti</p>
        <button
          onClick={() => { setSubmitted(true); onSubmit(0); }}
          className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-amber-950 transition-colors hover:bg-amber-400"
        >
          Tęsti
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <Coins className="h-12 w-12 text-amber-400" />
      <h2 className="text-2xl font-bold text-amber-50">Statymų raundas!</h2>
      <p className="text-center text-amber-200/60">
        Kiek taškų statysite? Teisingai = statymas ×2, neteisingai = prarandate.
      </p>

      <div className="rounded-xl border-2 border-amber-400/20 bg-amber-400/5 px-6 py-3 text-center">
        <p className="text-xs text-amber-200/50">Jūsų taškai</p>
        <p className="text-2xl font-bold text-amber-50">{currentScore}</p>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-2">
        {PRESETS.filter((p) => p <= maxWager).map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(preset)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              amount === preset
                ? "bg-amber-500 text-amber-950"
                : "bg-white/10 text-amber-200 hover:bg-white/20"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="w-full max-w-xs">
        <input
          type="range"
          min={0}
          max={maxWager}
          step={10}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
        <p className="mt-1 text-center text-lg font-bold text-amber-50">{amount} tšk.</p>
      </div>

      <button
        onClick={handleSubmit}
        className="rounded-xl bg-amber-500 px-10 py-4 text-lg font-bold text-amber-950 transition-colors hover:bg-amber-400"
      >
        Statyti!
      </button>
    </div>
  );
}
