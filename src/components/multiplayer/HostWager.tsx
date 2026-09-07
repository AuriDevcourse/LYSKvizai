"use client";

import { Coins, Check } from "lucide-react";
import type { PlayerInfo } from "@/lib/multiplayer/types";
import Avatar from "@/components/Avatar";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface HostWagerProps {
  players: PlayerInfo[];
  onAdvance: () => void;
}

/**
 * The wager phase, on the big screen.
 *
 * This used to be a static row of avatars and a count of how many players were
 * in the room — no indication of who had actually locked something in. The
 * host had to guess when to move on during the most dramatic moment of the
 * game. Now each avatar shows whether that player has submitted, and the
 * button says how many are still deciding.
 *
 * What it deliberately does not show is the *amount*. `hasWagered` is a
 * boolean for exactly that reason: a wager everyone can see isn't a wager.
 */
export default function HostWager({ players, onAdvance }: HostWagerProps) {
  const { t } = useTranslation();
  const activePlayers = players.filter((p) => !p.eliminated);
  const submitted = activePlayers.filter((p) => p.hasWagered);
  const waiting = activePlayers.length - submitted.length;
  const allIn = waiting === 0 && activePlayers.length > 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <Coins className={`h-16 w-16 ${allIn ? "text-answer-yellow" : "text-white"}`} />
      <h2 className="font-headline text-3xl font-extrabold text-white">{t("hostWager.phase")}</h2>
      <p className="text-white/60">{t("hostWager.choosing")}</p>

      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-end justify-center gap-3">
          {activePlayers.map((p) => (
            <div key={p.id} className="flex w-16 flex-col items-center gap-1">
              <div className="relative">
                {/* Undecided players stay dim, so the host reads the room at a
                    glance instead of counting. */}
                <div className={p.hasWagered ? "" : "opacity-30"}>
                  <Avatar value={p.emoji} size={44} />
                </div>
                {p.hasWagered && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 animate-bounce-in items-center justify-center rounded-full bg-answer-green ring-2 ring-background">
                    <Check className="h-3 w-3 text-background" strokeWidth={3.5} />
                  </span>
                )}
              </div>
              <span
                className={`w-full truncate text-center text-[11px] font-bold ${
                  p.hasWagered ? "text-white" : "text-white/35"
                }`}
              >
                {p.name}
              </span>
            </div>
          ))}
        </div>

        <p className="font-headline text-2xl font-extrabold tabular-nums text-white">
          {submitted.length}
          <span className="text-white/35">/{activePlayers.length}</span>{" "}
          <span className="text-sm font-bold text-white/50">locked in</span>
        </p>
      </div>

      <button
        onClick={onAdvance}
        className="btn-primary min-h-[52px] !px-8 !py-0 !text-lg"
      >
        {waiting > 0
          ? `${t("hostWager.startQuestion")} — ${waiting} still deciding`
          : t("hostWager.startQuestion")}
      </button>
    </div>
  );
}
