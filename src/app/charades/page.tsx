"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, X, RotateCcw, Home, Smartphone } from "lucide-react";
import type { Question } from "@/data/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function extractWords(questions: Question[]): string[] {
  const words = questions
    .map((q) => q.options[q.correct])
    .filter((w) => {
      if (/^\d+(%|\s|$)/.test(w)) return false; // skip numbers
      if (w.length > 40) return false; // too long
      if (w.length < 2) return false;
      return true;
    });
  return shuffleArray([...new Set(words)]);
}

const GAME_DURATION = 60;

type Phase = "loading" | "ready" | "countdown" | "playing" | "flash" | "results";

export default function CharadesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-[#46178f]">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      }
    >
      <CharadesInner />
    </Suspense>
  );
}

function CharadesInner() {
  const searchParams = useSearchParams();
  const { t, lang } = useTranslation();

  const [phase, setPhase] = useState<Phase>("loading");
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [skippedWords, setSkippedWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [flashColor, setFlashColor] = useState<"green" | "red" | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [hasGyro, setHasGyro] = useState(false);
  const cooldownRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Load words from quizzes
  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
    if (ids.length === 0) {
      setPhase("ready");
      return;
    }
    Promise.all(
      ids.map((id) =>
        fetch(`/api/quizzes/${id}?lang=${lang}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      const allQuestions: Question[] = results
        .filter(Boolean)
        .flatMap((q: { questions: Question[] }) => q.questions);
      setWords(extractWords(allQuestions));
      setPhase("ready");
    });
  }, [searchParams, lang]);

  // Countdown timer (3-2-1)
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Game timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase("results");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Wake lock
  useEffect(() => {
    if (phase === "playing" || phase === "flash" || phase === "countdown") {
      navigator.wakeLock?.request("screen").then((wl) => {
        wakeLockRef.current = wl;
      }).catch(() => {});
    }
    return () => {
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [phase]);

  const nextWord = useCallback(
    (correct: boolean) => {
      if (cooldownRef.current) return;
      cooldownRef.current = true;

      const word = words[currentIndex];
      if (correct) {
        setCorrectWords((prev) => [...prev, word]);
      } else {
        setSkippedWords((prev) => [...prev, word]);
      }
      setFlashColor(correct ? "green" : "red");
      setPhase("flash");

      setTimeout(() => {
        setFlashColor(null);
        const nextIdx = currentIndex + 1;
        if (nextIdx >= words.length) {
          setPhase("results");
        } else {
          setCurrentIndex(nextIdx);
          setPhase("playing");
        }
        lastTiltRef.current = "none";
        cooldownRef.current = false;
      }, 1200);
    },
    [words, currentIndex]
  );

  // Lock to portrait (beta axis works correctly for forehead tilt detection)
  useEffect(() => {
    const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    so.lock?.("portrait").catch(() => {});
    return () => { so.unlock?.(); };
  }, []);

  // Device orientation with debounce — must sustain tilt for 300ms
  const tiltTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTiltRef = useRef<"none" | "correct" | "skip">("none");

  useEffect(() => {
    if (phase !== "playing" && phase !== "flash") return;

    const handler = (e: DeviceOrientationEvent) => {
      if (phase !== "playing" || cooldownRef.current) return;
      const beta = e.beta ?? 90;

      let tiltDir: "none" | "correct" | "skip" = "none";
      if (beta > 150) tiltDir = "correct";  // strong tilt down
      else if (beta < 30) tiltDir = "skip"; // strong tilt up

      // If tilt direction changed, reset debounce timer
      if (tiltDir !== lastTiltRef.current) {
        lastTiltRef.current = tiltDir;
        if (tiltTimerRef.current) clearTimeout(tiltTimerRef.current);
        tiltTimerRef.current = null;

        if (tiltDir !== "none") {
          // Start debounce — must hold for 300ms
          tiltTimerRef.current = setTimeout(() => {
            nextWord(tiltDir === "correct");
          }, 300);
        }
      }
    };

    window.addEventListener("deviceorientation", handler);
    return () => {
      window.removeEventListener("deviceorientation", handler);
      if (tiltTimerRef.current) clearTimeout(tiltTimerRef.current);
    };
  }, [phase, nextWord]);

  const handleStart = async () => {
    // Request gyro permission on iOS
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (DOE.requestPermission) {
      try {
        const perm = await DOE.requestPermission();
        setHasGyro(perm === "granted");
      } catch {
        setHasGyro(false);
      }
    } else {
      // Android/desktop — check if events fire
      setHasGyro("DeviceOrientationEvent" in window && "ontouchstart" in window);
    }
    setCountdown(3);
    setPhase("countdown");
  };

  const handleRestart = () => {
    setWords(shuffleArray(words));
    setCurrentIndex(0);
    setCorrectWords([]);
    setSkippedWords([]);
    setTimeLeft(GAME_DURATION);
    setPhase("ready");
  };

  // === LOADING ===
  if (phase === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#46178f]">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  // === READY ===
  if (phase === "ready") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#46178f] bg-pattern px-6">
        <Smartphone className="h-16 w-16 text-white animate-bounce" />
        <h1 className="text-4xl font-extrabold text-white">
          {t("charades.title")}
        </h1>
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-bold text-white/70">
            {t("charades.holdOnForehead")}
          </p>
          <div className="flex flex-col gap-1 rounded-2xl bg-white/10 px-5 py-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">⬇️</span>
              <span className="text-sm font-extrabold text-[#26890c]">{t("charades.tiltDown")}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">⬆️</span>
              <span className="text-sm font-extrabold text-[#e21b3c]">{t("charades.tiltUp")}</span>
            </div>
          </div>
        </div>
        <p className="text-sm font-bold text-white/50">
          {words.length} {t("charades.words")} · {GAME_DURATION}s
        </p>
        {words.length > 0 ? (
          <button onClick={handleStart} className="btn-primary text-lg px-10 py-4">
            {t("charades.start")}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-white/50 font-bold mb-4">{t("quizPicker.noQuizzes")}</p>
            <Link href="/" className="btn-primary px-6 py-3">{t("nav.home")}</Link>
          </div>
        )}
      </div>
    );
  }

  // === COUNTDOWN ===
  if (phase === "countdown") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#46178f]">
        <span className="text-9xl font-black text-white animate-bounce-in">
          {countdown || "GO!"}
        </span>
      </div>
    );
  }

  // === RESULTS ===
  if (phase === "results") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#46178f] bg-pattern px-6">
        <h1 className="text-3xl font-extrabold text-white">
          {t("charades.timeUp")}
        </h1>

        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-5xl font-black text-[#26890c]">{correctWords.length}</span>
            <span className="text-sm font-bold text-white/50">{t("charades.correct")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-5xl font-black text-[#e21b3c]">{skippedWords.length}</span>
            <span className="text-sm font-bold text-white/50">{t("charades.skipped")}</span>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-1.5 max-h-[40vh] overflow-y-auto">
          {correctWords.map((w, i) => (
            <div key={`c${i}`} className="flex items-center gap-2 rounded-xl bg-[#26890c]/20 px-4 py-2">
              <Check className="h-4 w-4 text-[#26890c] shrink-0" />
              <span className="text-sm font-bold text-white">{w}</span>
            </div>
          ))}
          {skippedWords.map((w, i) => (
            <div key={`s${i}`} className="flex items-center gap-2 rounded-xl bg-[#e21b3c]/20 px-4 py-2">
              <X className="h-4 w-4 text-[#e21b3c] shrink-0" />
              <span className="text-sm font-bold text-white/60">{w}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={handleRestart} className="flex items-center gap-2 btn-secondary px-5 py-3 font-bold">
            <RotateCcw className="h-4 w-4" />
            {t("charades.playAgain")}
          </button>
          <Link href="/" className="flex items-center gap-2 btn-primary px-5 py-3">
            <Home className="h-4 w-4" />
            {t("nav.home")}
          </Link>
        </div>
      </div>
    );
  }

  // === PLAYING / FLASH ===
  const currentWord = words[currentIndex] ?? "";
  const bgColor =
    flashColor === "green"
      ? "bg-[#26890c]"
      : flashColor === "red"
        ? "bg-[#e21b3c]"
        : "bg-[#46178f]";

  return (
    <div
      className={`flex min-h-svh flex-col items-center justify-between transition-colors duration-200 ${bgColor}`}
    >
      {/* Timer bar */}
      <div className="w-full px-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white/50">
            {correctWords.length} ✓ · {skippedWords.length} ✗
          </span>
          <span className={`text-2xl font-black ${timeLeft <= 10 ? "text-[#e21b3c]" : "text-white"}`}>
            {timeLeft}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              timeLeft <= 10 ? "bg-[#e21b3c]" : "bg-white/40"
            }`}
            style={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
          />
        </div>
      </div>

      {/* Word display */}
      <div className="flex flex-1 items-center justify-center px-6">
        {flashColor ? (
          <div className="animate-bounce-in">
            {flashColor === "green" ? (
              <Check className="h-24 w-24 text-white" />
            ) : (
              <X className="h-24 w-24 text-white" />
            )}
          </div>
        ) : (
          <h1 className="text-center text-5xl font-black leading-tight text-white sm:text-7xl lg:text-8xl animate-fade-in-up">
            {currentWord}
          </h1>
        )}
      </div>

      {/* Manual buttons (for desktop or no-gyro) */}
      {!hasGyro && !flashColor && (
        <div className="grid w-full grid-cols-2 gap-0">
          <button
            onClick={() => nextWord(false)}
            className="flex items-center justify-center gap-2 bg-[#e21b3c] py-6 text-xl font-extrabold text-white active:brightness-75"
          >
            <X className="h-6 w-6" />
            {t("charades.skip")}
          </button>
          <button
            onClick={() => nextWord(true)}
            className="flex items-center justify-center gap-2 bg-[#26890c] py-6 text-xl font-extrabold text-white active:brightness-75"
          >
            <Check className="h-6 w-6" />
            {t("charades.correct")}
          </button>
        </div>
      )}

      {hasGyro && !flashColor && (
        <div className="pb-6 text-center text-sm font-bold text-white/30">
          ↓ {t("charades.tiltDown")} &nbsp;·&nbsp; ↑ {t("charades.tiltUp")}
        </div>
      )}
    </div>
  );
}
