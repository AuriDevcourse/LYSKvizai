"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Pencil, ArrowLeft, Loader2 } from "lucide-react";
import type { QuizMeta } from "@/data/types";
import { getQuizTheme } from "@/lib/quiz-theme";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { useContentTranslation } from "@/hooks/useContentTranslation";

export default function EditorPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [quizzes, setQuizzes] = useState<QuizMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const quizTitles = useContentTranslation(quizzes.map((q) => q.title));

  const fetchQuizzes = () => {
    fetch("/api/quizzes")
      .then((res) => res.json())
      .then((data) => setQuizzes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchQuizzes, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch {
      alert("Error deleting quiz");
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = () => {
    router.push("/editor/new");
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#46178f] bg-pattern">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.07] blur-3xl" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-red-500/[0.05] blur-3xl" />
      </div>

      <main className="relative z-10 flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("editor.title")}</h1>
            <p className="text-sm text-white/50">{t("editor.quizLibrary")}</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-semibold text-[#46178f] transition-colors hover:bg-white/90"
          >
            <Plus className="h-4 w-4" />
            {t("editor.create")}
          </button>
        </div>

        {/* Quiz list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-5xl">📝</div>
            <p className="text-lg text-white/50">{t("editor.noQuizzes")}</p>
            <p className="mt-1 text-sm text-white/30">
              {t("editor.getStarted")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center gap-4 rounded-2xl border-2 border-white/15 bg-white/5 px-5 py-4"
              >
                {(() => {
                  const theme = getQuizTheme(quiz.id);
                  const Icon = theme.icon;
                  return (
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.bg}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white">{quizTitles[quizzes.indexOf(quiz)]}</h3>
                  <p className="text-sm text-white/40">
                    {quiz.questionCount} questions
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/editor/${quiz.id}`}
                    className="rounded-lg bg-white/10 p-2 text-white/60 hover:bg-white/20 hover:text-white/80"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    disabled={deleting === quiz.id}
                    className="rounded-lg bg-white/10 p-2 text-red-400/60 hover:bg-[#e21b3c]/20 hover:text-red-400 disabled:opacity-50"
                  >
                    {deleting === quiz.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back link */}
        <Link
          href="/"
          className="mt-8 flex items-center gap-1.5 self-center text-sm text-white/40 hover:text-white/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("nav.backToHome")}
        </Link>
      </main>
    </div>
  );
}
