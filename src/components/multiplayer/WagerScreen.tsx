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
        <Coins className="h-12 w-12 text-white" />
        <p className="text-lg font-bold text-white">Wager accepted!</p>
        <p className="text-white/50">You wagered {amount} pts</p>
        <p className="text-sm text-white/40">Waiting for other players...</p>
      </div>
    );
  }

  if (maxWager <= 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Coins className="h-12 w-12 text-white/50" />
        <p className="text-lg font-bold text-white">Wager round</p>
        <p className="text-white/50">No points to wager</p>
        <button
          onClick={() => { setSubmitted(true); onSubmit(0); }}
          className="rounded-xl bg-white text-[#46178f] px-8 py-3 font-bold transition-colors hover:bg-white/90"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <Coins className="h-12 w-12 text-white" />
      <h2 className="text-2xl font-bold text-white">Wager round!</h2>
      <p className="text-center text-white/60">
        How much will you wager? Correct = wager ×2, incorrect = you lose it.
      </p>

      <div className="rounded-xl border-2 border-white/20 bg-white/5 px-6 py-3 text-center">
        <p className="text-xs text-white/50">Your points</p>
        <p className="text-2xl font-bold text-white">{currentScore}</p>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-2">
        {PRESETS.filter((p) => p <= maxWager).map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(preset)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              amount === preset
                ? "bg-white text-[#46178f]"
                : "bg-white/10 text-white/80 hover:bg-white/20"
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
          className="w-full accent-white"
        />
        <p className="mt-1 text-center text-lg font-bold text-white">{amount} pts</p>
      </div>

      <button
        onClick={handleSubmit}
        className="rounded-xl bg-white text-[#46178f] px-10 py-4 text-lg font-bold transition-colors hover:bg-white/90"
      >
        Wager!
      </button>
    </div>
  );
}
