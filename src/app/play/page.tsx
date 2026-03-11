"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, LogIn, ArrowLeft, Loader2, Smartphone, Monitor } from "lucide-react";
import { useRoomActions } from "@/hooks/useRoomActions";
import JoinForm from "@/components/multiplayer/JoinForm";
import QuizPicker from "@/components/QuizPicker";
import GameModeSelector from "@/components/multiplayer/GameModeSelector";
import AvatarBuilder from "@/components/AvatarBuilder";
import type { GameMode } from "@/lib/multiplayer/types";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function PlayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") ?? "";

  const [mode, setMode] = useState<"menu" | "pick-quiz" | "pick-mode" | "host-join" | "join" | "creating">(
    codeFromUrl ? "join" : "menu"
  );
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>("classic");
  const [gameModeOptions, setGameModeOptions] = useState<{ teamCount?: number; eliminationInterval?: number }>({});
  const [hostName, setHostName] = useState("");
  const [hostAvatar, setHostAvatar] = useState("");
  const [hostPlaying, setHostPlaying] = useState(false);
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

  const handleQuizNext = () => {
    if (selectedQuizIds.length === 0) return;
    setMode("pick-mode");
  };

  const handleGameModeSelect = (gameMode: GameMode, options: { teamCount?: number; eliminationInterval?: number }) => {
    setSelectedGameMode(gameMode);
    setGameModeOptions(options);
    // Ask if host wants to play too (mobile/bar mode)
    setMode("host-join");
  };

  const handleCreateRoom = async () => {
    if (selectedQuizIds.length === 0) return;
    setMode("creating");
    setError(null);
    try {
      const hostId = playerId;
      const result = await createRoom(
        hostId,
        selectedQuizIds,
        15,
        20,
        selectedGameMode,
        gameModeOptions.teamCount,
        gameModeOptions.eliminationInterval
      );
      sessionStorage.setItem("quiz-host-id", hostId);

      // If host wants to play, also join as a player
      if (hostPlaying && hostName.trim()) {
        await joinRoom(result.code, hostId, hostName.trim(), hostAvatar);
        sessionStorage.setItem("quiz-player-name", hostName.trim());
        sessionStorage.setItem("quiz-player-emoji", hostAvatar);
        sessionStorage.setItem("quiz-host-playing", "true");
      } else {
        sessionStorage.removeItem("quiz-host-playing");
      }

      router.push(`/play/${result.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Klaida kuriant kambarį");
      setMode("host-join");
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
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in-up">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Žaisti su draugais
          </h1>

          {error && (
            <p className="w-full rounded-xl bg-[#e21b3c]/20 px-4 py-3 text-center text-sm font-bold text-white">
              {error}
            </p>
          )}

          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => setMode("pick-quiz")}
              className="btn-primary flex items-center justify-center gap-2 w-full"
            >
              <Plus className="h-5 w-5" />
              Sukurti žaidimą
            </button>
            <button
              onClick={() => setMode("join")}
              className="btn-secondary flex items-center justify-center gap-2 w-full"
            >
              <LogIn className="h-5 w-5" />
              Prisijungti
            </button>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-2 flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Pradžia
          </button>
        </div>
      )}

      {mode === "pick-quiz" && (
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in-up">
          <h1 className="text-2xl font-extrabold text-white">Pasirink kvizus</h1>
          <p className="text-sm font-bold text-white/50">Gali pasirinkti kelis — klausimai bus sumaišyti</p>

          {error && (
            <p className="w-full rounded-xl bg-[#e21b3c]/20 px-4 py-3 text-center text-sm font-bold text-white">
              {error}
            </p>
          )}

          <div className="w-full">
            <QuizPicker onSelect={setSelectedQuizIds} selectedIds={selectedQuizIds} />
          </div>

          <button
            onClick={handleQuizNext}
            disabled={selectedQuizIds.length === 0}
            className="btn-primary w-full text-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Toliau →{selectedQuizIds.length > 1 ? ` (${selectedQuizIds.length} kvizai)` : ""}
          </button>

          <button
            onClick={() => { setMode("menu"); setError(null); setSelectedQuizIds([]); }}
            className="flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Atgal
          </button>
        </div>
      )}

      {mode === "pick-mode" && (
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in-up">
          <h1 className="text-2xl font-extrabold text-white">Pasirink režimą</h1>

          {error && (
            <p className="w-full rounded-xl bg-[#e21b3c]/20 px-4 py-3 text-center text-sm font-bold text-white">
              {error}
            </p>
          )}

          <div className="w-full">
            <GameModeSelector onSelect={handleGameModeSelect} />
          </div>

          <button
            onClick={() => { setMode("pick-quiz"); setError(null); }}
            className="flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Atgal
          </button>
        </div>
      )}

      {mode === "host-join" && (
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in-up">
          <h1 className="text-2xl font-extrabold text-white">Kaip žaisi?</h1>

          {error && (
            <p className="w-full rounded-xl bg-[#e21b3c]/20 px-4 py-3 text-center text-sm font-bold text-white">
              {error}
            </p>
          )}

          <div className="flex w-full flex-col gap-3">
            {/* Option 1: Host on big screen (spectator) */}
            <button
              onClick={() => {
                setHostPlaying(false);
                handleCreateRoom();
              }}
              className="flex items-center gap-4 rounded-2xl glass px-5 py-4 text-left transition-all hover:bg-white/15"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">Didelis ekranas</p>
                <p className="text-xs font-bold text-white/50">Rodyti klausimus ekrane, žaidėjai jungiasi telefonais</p>
              </div>
            </button>

            {/* Option 2: Host also plays (mobile/bar mode) */}
            <button
              onClick={() => {
                setHostPlaying(true);
              }}
              className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all ${
                hostPlaying
                  ? "bg-white/15 ring-2 ring-white"
                  : "glass hover:bg-white/15"
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">Žaisiu kartu</p>
                <p className="text-xs font-bold text-white/50">Visi žaidžia telefonais — tu irgi atsakinėji</p>
              </div>
            </button>
          </div>

          {/* Name + avatar form when host wants to play */}
          {hostPlaying && (
            <div className="flex w-full flex-col gap-4 animate-fade-in-up">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-white/60">
                  Vardas
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="Pvz., Jonas"
                  maxLength={20}
                  className="w-full rounded-xl border-2 border-white/15 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-white/20 focus:border-white/35 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-white/60">
                  Avatar
                </label>
                <AvatarBuilder onChange={setHostAvatar} />
              </div>
              <button
                onClick={handleCreateRoom}
                disabled={!hostName.trim()}
                className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sukurti žaidimą
              </button>
            </div>
          )}

          <button
            onClick={() => { setMode("pick-mode"); setError(null); setHostPlaying(false); }}
            className="flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Atgal
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in-up">
          <h1 className="text-2xl font-extrabold text-white">Prisijungti</h1>

          <JoinForm
            initialCode={codeFromUrl}
            onJoin={handleJoin}
            loading={loading}
            error={error}
          />

          <button
            onClick={() => { setMode("menu"); setError(null); }}
            className="flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Atgal
          </button>
        </div>
      )}

      {mode === "creating" && (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
          <p className="text-lg font-bold text-white/60">Kuriamas kambarys...</p>
        </div>
      )}
    </main>
  );
}

export default function PlayPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#46178f] bg-pattern">
      <Suspense
        fallback={
          <div className="relative z-10 flex flex-1 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        }
      >
        <PlayPageInner />
      </Suspense>
    </div>
  );
}
