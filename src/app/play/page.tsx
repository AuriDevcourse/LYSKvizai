"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, LogIn, ArrowLeft, Loader2, Smartphone, Monitor, X } from "lucide-react";
import { useRoomActions } from "@/hooks/useRoomActions";
import JoinForm from "@/components/multiplayer/JoinForm";
import TopicPicker from "@/components/TopicPicker";
import GameSettings from "@/components/GameSettings";
import GameModeSelector from "@/components/multiplayer/GameModeSelector";
import AvatarBuilder from "@/components/AvatarBuilder";
import type { GameMode } from "@/lib/multiplayer/types";
import type { QuizMeta } from "@/data/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function PlayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const codeFromUrl = searchParams.get("code") ?? "";
  const joinFromUrl = searchParams.get("join") === "1";
  const createFromUrl = searchParams.get("create") === "1";

  const [mode, setMode] = useState<"menu" | "pick-quiz" | "pick-mode" | "host-join" | "join" | "creating">(
    codeFromUrl || joinFromUrl ? "join" : createFromUrl ? "pick-quiz" : "menu"
  );
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>("classic");
  const [gameModeOptions, setGameModeOptions] = useState<{ teamCount?: number; eliminationInterval?: number }>({});
  const [timer, setTimer] = useState(20);
  const [questionCount, setQuestionCount] = useState(15);
  const [quizMeta, setQuizMeta] = useState<QuizMeta[]>([]);
  const handleQuizMetaLoad = useCallback((data: QuizMeta[]) => setQuizMeta(data), []);
  const totalQuestions = useMemo(
    () => quizMeta.filter((q) => selectedQuizIds.includes(q.id)).reduce((sum, q) => sum + q.questionCount, 0),
    [quizMeta, selectedQuizIds]
  );
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
        questionCount === 0 ? 999 : questionCount,
        timer,
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
      setError(e instanceof Error ? e.message : "Error creating room");
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
      sessionStorage.removeItem("quiz-host-playing");
      router.push(`/play/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error joining");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative z-10 flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 pt-12 pb-8 sm:pt-8">
      {mode === "menu" && (
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in-up">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            {t("play.playWithFriends")}
          </h1>

          {error && (
            <p className="w-full rounded-xl bg-[#ff716c]/20 px-4 py-3 text-center text-sm font-bold text-white">
              {error}
            </p>
          )}

          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => setMode("pick-quiz")}
              className="btn-primary flex items-center justify-center gap-2 w-full"
            >
              <Plus className="h-5 w-5" />
              {t("play.createGame")}
            </button>
            <button
              onClick={() => setMode("join")}
              className="btn-secondary flex items-center justify-center gap-2 w-full"
            >
              <LogIn className="h-5 w-5" />
              {t("play.join")}
            </button>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-2 flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("nav.home")}
          </button>
        </div>
      )}

      {mode === "pick-quiz" && (
        <div className="flex w-full flex-col gap-6 animate-fade-in-up self-stretch">
          {error && (
            <p className="w-full rounded-xl bg-[#ff716c]/15 border border-[#ff716c]/20 px-4 py-3 text-center text-sm font-bold text-white">
              {error}
            </p>
          )}

          <div className="w-full">
            <TopicPicker onSelect={setSelectedQuizIds} selectedIds={selectedQuizIds} onQuizMetaLoad={handleQuizMetaLoad} />
          </div>

          {selectedQuizIds.length > 0 && (
            <GameSettings
              timer={timer}
              questionCount={questionCount}
              onTimerChange={setTimer}
              onCountChange={setQuestionCount}
              totalQuestions={totalQuestions}
            />
          )}

          <button
            onClick={handleQuizNext}
            disabled={selectedQuizIds.length === 0}
            className="btn-primary w-full text-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("play.next")}{selectedQuizIds.length > 1 ? ` (${selectedQuizIds.length} quizzes)` : ""}
          </button>

          <button
            onClick={() => { setMode("menu"); setError(null); setSelectedQuizIds([]); }}
            className="flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("play.back")}
          </button>
        </div>
      )}

      {mode === "pick-mode" && (
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in-up">
          <h1 className="text-2xl font-extrabold text-white">{t("play.pickMode")}</h1>

          {error && (
            <p className="w-full rounded-xl bg-[#ff716c]/20 px-4 py-3 text-center text-sm font-bold text-white">
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
            {t("play.back")}
          </button>
        </div>
      )}

      {mode === "host-join" && (
        <div className="flex w-full flex-col items-center gap-6 animate-fade-in-up">
          <h1 className="text-2xl font-extrabold text-white">{t("play.howWillYouPlay")}</h1>

          {error && (
            <p className="w-full rounded-xl bg-[#ff716c]/20 px-4 py-3 text-center text-sm font-bold text-white">
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
              className="flex items-center gap-4 rounded-2xl glass px-5 py-4 text-left transition-all hover:bg-white/5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">{t("play.bigScreen")}</p>
                <p className="text-xs font-bold text-white/50">{t("play.bigScreenDesc")}</p>
              </div>
            </button>

            {/* Option 2: Host also plays (mobile/bar mode) */}
            <button
              onClick={() => {
                setHostPlaying(true);
              }}
              className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all ${
                hostPlaying
                  ? "bg-white/5 outline outline-[1.5px] outline-[#ff9062]"
                  : "glass hover:bg-white/5"
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">{t("play.illPlayToo")}</p>
                <p className="text-xs font-bold text-white/50">{t("play.illPlayTooDesc")}</p>
              </div>
            </button>
          </div>

          {/* Name + avatar form when host wants to play */}
          {hostPlaying && (
            <div className="flex w-full flex-col gap-4 animate-fade-in-up">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-white/60">
                  {t("play.name")}
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder={t("play.namePlaceholder")}
                  maxLength={20}
                  className="w-full rounded-xl border-[1.5px] border-white/8 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-white/20 focus:border-white/35 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-white/60">
                  {t("play.avatar")}
                </label>
                <AvatarBuilder onChange={setHostAvatar} />
              </div>
              <button
                onClick={handleCreateRoom}
                disabled={!hostName.trim()}
                className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("play.createGame")}
              </button>
            </div>
          )}

          <button
            onClick={() => { setMode("pick-mode"); setError(null); setHostPlaying(false); }}
            className="flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("play.back")}
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="relative flex w-full flex-col items-center gap-6 animate-fade-in-up self-start -mt-8 sm:self-center sm:mt-0">
          <button
            onClick={() => { setMode("menu"); setError(null); }}
            className="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/20 hover:text-white sm:hidden"
          >
            <X className="h-5 w-5" />
          </button>

          <JoinForm
            initialCode={codeFromUrl}
            onJoin={handleJoin}
            loading={loading}
            error={error}
          />

          <button
            onClick={() => { setMode("menu"); setError(null); }}
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("play.back")}
          </button>
        </div>
      )}

      {mode === "creating" && (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
          <p className="text-lg font-bold text-white/60">{t("play.creatingRoom")}</p>
        </div>
      )}
    </main>
  );
}

export default function PlayPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center">
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
