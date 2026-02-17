"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, LogIn, ArrowLeft, Loader2 } from "lucide-react";
import { useRoomActions } from "@/hooks/useRoomActions";
import JoinForm from "@/components/multiplayer/JoinForm";
import QuizPicker from "@/components/QuizPicker";
import GameModeSelector from "@/components/multiplayer/GameModeSelector";
import type { GameMode } from "@/lib/multiplayer/types";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function PlayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") ?? "";

  const [mode, setMode] = useState<"menu" | "pick-quiz" | "pick-mode" | "join" | "creating">(
    codeFromUrl ? "join" : "menu"
  );
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>("classic");
  const [gameModeOptions, setGameModeOptions] = useState<{ teamCount?: number; eliminationInterval?: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { createRoom, joinRoom } = useRoomActions();

  const [playerId] = useState(() => {
    if (typeof window === "undefined") return generateId();
    const stored = sessionStorage.getItem("quiz-player-id");
    if (stored) return stored;
    const id = generateId();
    sessionStorage.setItem("quiz-player-id", id);
    return id;
  });

  const handleSelectQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
  };

  const handleQuizNext = () => {
    if (!selectedQuizId) return;
    setMode("pick-mode");
  };

  const handleGameModeSelect = (gameMode: GameMode, options: { teamCount?: number; eliminationInterval?: number }) => {
    setSelectedGameMode(gameMode);
    setGameModeOptions(options);
    handleCreateRoom(gameMode, options);
  };

  const handleCreateRoom = async (gameMode: GameMode, options: { teamCount?: number; eliminationInterval?: number }) => {
    if (!selectedQuizId) return;
    setMode("creating");
    setError(null);
    try {
      const hostId = playerId;
      const result = await createRoom(
        hostId,
        selectedQuizId,
        15,
        20,
        gameMode,
        options.teamCount,
        options.eliminationInterval
      );
      sessionStorage.setItem("quiz-host-id", hostId);
      router.push(`/play/${result.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Klaida kuriant kambarį");
      setMode("pick-mode");
    }
  };

  const handleJoin = async (code: string, name: string, emoji: string) => {
    setLoading(true);
    setError(null);
    try {
      await joinRoom(code, playerId, name, emoji);
      sessionStorage.setItem("quiz-player-name", name);
      sessionStorage.setItem("quiz-player-emoji", emoji);
      sessionStorage.removeItem("quiz-host-id");
      router.push(`/play/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Klaida jungiantis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative z-10 flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-8">
      {mode === "menu" && (
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-400/10">
            <Plus className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-amber-50 sm:text-3xl">
            Žaisti su draugais
          </h1>
          <p className="text-center text-amber-200/50">
            Sukurk kambarį arba prisijunk prie esamo
          </p>

          {error && (
            <p className="w-full rounded-lg bg-red-400/10 px-3 py-2 text-center text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => setMode("pick-quiz")}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-4 text-lg font-bold text-amber-950 transition-colors hover:bg-amber-400"
            >
              <Plus className="h-5 w-5" />
              Sukurti žaidimą
            </button>
            <button
              onClick={() => setMode("join")}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-amber-400/30 bg-amber-400/5 px-6 py-4 text-lg font-semibold text-amber-100 transition-colors hover:border-amber-400/50 hover:bg-amber-400/10"
            >
              <LogIn className="h-5 w-5" />
              Prisijungti
            </button>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-4 flex items-center gap-1.5 text-sm text-amber-200/40 hover:text-amber-200/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Grįžti į pradžią
          </button>
        </div>
      )}

      {mode === "pick-quiz" && (
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in">
          <h1 className="text-xl font-bold text-amber-50">Pasirink kvizą</h1>
          <p className="text-center text-sm text-amber-200/50">
            Kurį kvizą žaisit su draugais?
          </p>

          {error && (
            <p className="w-full rounded-lg bg-red-400/10 px-3 py-2 text-center text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="w-full">
            <QuizPicker onSelect={handleSelectQuiz} selectedId={selectedQuizId ?? undefined} />
          </div>

          <button
            onClick={handleQuizNext}
            disabled={!selectedQuizId}
            className="w-full rounded-xl bg-amber-500 px-6 py-4 text-lg font-bold text-amber-950 transition-colors hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Toliau
          </button>

          <button
            onClick={() => { setMode("menu"); setError(null); setSelectedQuizId(null); }}
            className="flex items-center gap-1.5 text-sm text-amber-200/40 hover:text-amber-200/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Atgal
          </button>
        </div>
      )}

      {mode === "pick-mode" && (
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in">
          <h1 className="text-xl font-bold text-amber-50">Pasirink režimą</h1>

          {error && (
            <p className="w-full rounded-lg bg-red-400/10 px-3 py-2 text-center text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="w-full">
            <GameModeSelector onSelect={handleGameModeSelect} />
          </div>

          <button
            onClick={() => { setMode("pick-quiz"); setError(null); }}
            className="flex items-center gap-1.5 text-sm text-amber-200/40 hover:text-amber-200/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Atgal
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10">
            <LogIn className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-amber-50">Prisijungti prie žaidimo</h1>

          <JoinForm
            initialCode={codeFromUrl}
            onJoin={handleJoin}
            loading={loading}
            error={error}
          />

          <button
            onClick={() => { setMode("menu"); setError(null); }}
            className="flex items-center gap-1.5 text-sm text-amber-200/40 hover:text-amber-200/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Atgal
          </button>
        </div>
      )}

      {mode === "creating" && (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-amber-400" />
          <p className="text-lg text-amber-200/60">Kuriamas kambarys...</p>
        </div>
      )}
    </main>
  );
}

export default function PlayPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#0f0e0a]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-red-500/[0.05] blur-3xl" />
      </div>

      <Suspense
        fallback={
          <div className="relative z-10 flex flex-1 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
          </div>
        }
      >
        <PlayPageInner />
      </Suspense>
    </div>
  );
}
