"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

interface RoomCodeDisplayProps {
  code: string;
}

/**
 * The room code, sized to be read from the back of a room.
 *
 * This is the single most important thing on the projected screen — everyone's
 * way in — so it gets the treatment: oversized tiles that flip in one after
 * another, a lit top edge, and an orange glow beneath so it lifts off the page.
 */
export default function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
        {t("lobby.roomCode")}
      </span>
      <div className="flex gap-2.5 sm:gap-3" style={{ perspective: "700px" }}>
        {code.split("").map((char, i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 90}ms` }}
            className="code-tile font-headline flex h-16 w-14 items-center justify-center rounded-2xl text-4xl font-extrabold tracking-tight text-white sm:h-20 sm:w-18 sm:text-5xl lg:h-24 lg:w-20 lg:text-6xl"
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
