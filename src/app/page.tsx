"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Zap } from "lucide-react";
import QuizPicker from "@/components/QuizPicker";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#46178f] bg-pattern">
      <main className="relative z-10 flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8">
        {/* Logo */}
        <div className="mb-10 text-center animate-fade-in-up">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            LYS
            <span className="ml-1 text-yellow-300">Kvizai</span>
          </h1>
        </div>

        {/* Quiz grid */}
        <QuizPicker onSelect={(id) => router.push(`/quiz/${id}`)} />

        {/* Action links */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
          <Link href="/play" className="btn-primary flex items-center gap-2">
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
        LYS Kvizai &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
