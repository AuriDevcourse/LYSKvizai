"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Pencil } from "lucide-react";
import QuizPicker from "@/components/QuizPicker";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#0f0e0a]">
      {/* Decorative gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-red-500/[0.05] blur-3xl" />
        <div className="absolute left-0 top-1/2 h-[300px] w-[300px] rounded-full bg-emerald-500/[0.04] blur-3xl" />
      </div>

      <main className="relative z-10 flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-6xl">🧠</div>
          <h1 className="mb-2 text-3xl font-bold text-amber-50 sm:text-4xl">
            LYS Kvizai
          </h1>
          <p className="text-amber-200/50">
            Pasirink kvizą ir tikrink savo žinias!
          </p>
        </div>

        {/* Quiz grid */}
        <QuizPicker onSelect={(id) => router.push(`/quiz/${id}`)} />

        {/* Action links */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/play"
            className="flex items-center gap-2 rounded-xl border-2 border-amber-400/30 bg-amber-400/5 px-6 py-3 font-semibold text-amber-100 transition-colors hover:border-amber-400/50 hover:bg-amber-400/10"
          >
            <Users className="h-5 w-5" />
            Žaisti su draugais
          </Link>
          <Link
            href="/editor"
            className="flex items-center gap-2 rounded-xl border-2 border-white/10 bg-white/5 px-6 py-3 font-semibold text-amber-200/70 transition-colors hover:border-white/20 hover:bg-white/10"
          >
            <Pencil className="h-4 w-4" />
            Redaktorius
          </Link>
        </div>

        {/* Decorative emojis */}
        <div className="mt-8 flex justify-center gap-6 text-2xl">
          <span title="Morė">🔥</span>
          <span title="Blynai">🥞</span>
          <span title="Kaukės">🎪</span>
          <span title="Žiema">🥶</span>
          <span title="Pavasaris">🌸</span>
        </div>
      </main>

      <footer className="relative z-10 pb-4 text-center text-xs text-amber-200/30">
        LYS Kvizai &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
