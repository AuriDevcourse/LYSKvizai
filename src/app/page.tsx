"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Play, Heart, Swords } from "lucide-react";
import TopicPicker from "@/components/TopicPicker";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type GameMode = "classic" | "survival";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<GameMode>("classic");

  const handleStart = () => {
    if (selectedIds.length === 0) return;

    if (mode === "survival") {
      router.push(`/survival?ids=${selectedIds.join(",")}`);
      return;
    }

    // Classic
    if (selectedIds.length === 1) {
      router.push(`/quiz/${selectedIds[0]}`);
    } else {
      router.push(`/quiz/mix?ids=${selectedIds.join(",")}`);
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#46178f] bg-pattern">
      <main className="relative z-10 flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8">
        {/* Logo */}
        <div className="mb-10 text-center animate-fade-in-up">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            Quiz<span className="text-yellow-300">mo</span>
          </h1>
        </div>

        {/* Topic grid → drill into subtopics */}
        <TopicPicker onSelect={setSelectedIds} selectedIds={selectedIds} />

        {/* Mode selector + Start — shown when topics selected */}
        {selectedIds.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 animate-slide-up">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("classic")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-bold transition-all ${
                  mode === "classic"
                    ? "border-white bg-white/20 text-white"
                    : "border-white/20 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <Swords className="h-5 w-5" />
                {t("home.classic")}
              </button>
              <button
                onClick={() => setMode("survival")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-bold transition-all ${
                  mode === "survival"
                    ? "border-red-400 bg-red-500/20 text-white"
                    : "border-white/20 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <Heart className="h-5 w-5" />
                {t("home.survival")}
              </button>
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              <Play className="h-5 w-5" fill="currentColor" />
              Start
            </button>
          </div>
        )}

        {/* Action links — hidden on mobile (bottom nav handles it) */}
        <div className="mt-6 hidden sm:flex sm:flex-row sm:justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
          <Link href="/play" className="btn-secondary flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("home.playWithFriends")}
          </Link>
        </div>
      </main>

      <footer className="relative z-10 pb-20 sm:pb-4 text-center text-xs text-white/30">
        Quizmo &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
