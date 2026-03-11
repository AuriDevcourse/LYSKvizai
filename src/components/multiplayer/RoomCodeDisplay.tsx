"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

interface RoomCodeDisplayProps {
  code: string;
}

export default function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm uppercase tracking-wider text-white/50">
        {t("lobby.roomCode")}
      </span>
      <div className="flex gap-2">
        {code.split("").map((char, i) => (
          <span
            key={i}
            className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-3xl font-bold text-white"
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
