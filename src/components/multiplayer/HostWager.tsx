"use client";

import { Coins } from "lucide-react";
import type { PlayerInfo } from "@/lib/multiplayer/types";

interface HostWagerProps {
  players: PlayerInfo[];
  onAdvance: () => void;
}

export default function HostWager({ players, onAdvance }: HostWagerProps) {
  const activePlayers = players.filter((p) => !p.eliminated);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <Coins className="h-16 w-16 text-amber-400" />
      <h2 className="text-3xl font-bold text-amber-50">Statymų fazė</h2>
      <p className="text-amber-200/60">Žaidėjai renkasi kiek statyti</p>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {activePlayers.map((p) => (
            <span key={p.id} className="text-2xl">{p.emoji}</span>
          ))}
        </div>
        <p className="text-sm text-amber-200/50">{activePlayers.length} žaidėjai</p>
      </div>

      <button
        onClick={onAdvance}
        className="rounded-xl bg-amber-500 px-8 py-4 text-lg font-bold text-amber-950 transition-colors hover:bg-amber-400"
      >
        Pradėti klausimą
      </button>
    </div>
  );
}
