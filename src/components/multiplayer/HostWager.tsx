"use client";

import { Coins } from "lucide-react";
import type { PlayerInfo } from "@/lib/multiplayer/types";
import Avatar from "@/components/Avatar";

interface HostWagerProps {
  players: PlayerInfo[];
  onAdvance: () => void;
}

export default function HostWager({ players, onAdvance }: HostWagerProps) {
  const activePlayers = players.filter((p) => !p.eliminated);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <Coins className="h-16 w-16 text-white" />
      <h2 className="text-3xl font-bold text-white">Statymų fazė</h2>
      <p className="text-white/60">Žaidėjai renkasi kiek statyti</p>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {activePlayers.map((p) => (
            <Avatar key={p.id} value={p.emoji} size={36} />
          ))}
        </div>
        <p className="text-sm text-white/50">{activePlayers.length} žaidėjai</p>
      </div>

      <button
        onClick={onAdvance}
        className="rounded-xl bg-white text-[#46178f] px-8 py-4 text-lg font-bold transition-colors hover:bg-white/90"
      >
        Pradėti klausimą
      </button>
    </div>
  );
}
