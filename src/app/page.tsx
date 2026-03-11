"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Zap, Play } from "lucide-react";
import QuizPicker from "@/components/QuizPicker";

export default function Home() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleStart = () => {
    if (selectedIds.length === 0) return;
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

        {/* Quiz grid */}
        <QuizPicker onSelect={setSelectedIds} selectedIds={selectedIds} />

        {/* Start button */}
        {selectedIds.length > 0 && (
          <button
            onClick={handleStart}
            className="btn-primary mt-6 flex w-full items-center justify-center gap-2 animate-slide-up"
          >
            <Play className="h-5 w-5" fill="currentColor" />
            Pradėti{selectedIds.length > 1 ? ` (${selectedIds.length} kvizai)` : ""}
          </button>
        )}

        {/* Action links */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
          <Link href="/play" className="btn-secondary flex items-center gap-2">
            <Users className="h-5 w-5" />
            Žaisti su draugais
          </Link>
          <Link href="/editor" className="btn-secondary flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Redaktorius
          </Link>
        </div>
      </main>

      <footer className="relative z-10 pb-4 text-center text-xs text-white/30">
        Quizmo &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
