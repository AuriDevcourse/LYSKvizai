"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Pencil, ArrowLeft, Loader2, FileText } from "lucide-react";
import type { QuizMeta } from "@/data/types";
import { getQuizTheme } from "@/lib/quiz-theme";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EditorUnlock from "@/components/editor/EditorUnlock";
import { editorFetch, EditorAuthError } from "@/lib/editor-auth";

export default function EditorPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [quizzes, setQuizzes] = useState<QuizMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<QuizMeta | null>(null);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const quizTitles = quizzes.map((q) => q.title);

  const fetchQuizzes = () => {
    fetch(`/api/quizzes?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => setQuizzes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchQuizzes, [lang]);

  const runDelete = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      const res = await editorFetch(`/api/quizzes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not delete this quiz");
      }
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (e) {
      if (e instanceof EditorAuthError) {
        // Ask for the password, then let them retry.
        setAuthPrompt(e.message);
      } else {
        console.error("Delete failed", e);
        setError(e instanceof Error ? e.message : "Could not delete this quiz");
      }
    } finally {
      setDeleting(null);
      setPendingDelete(null);
    }
  };

  const handleCreate = () => {
    router.push("/editor/new");
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.07] blur-3xl" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-red-500/[0.05] blur-3xl" />
      </div>

      <main className="relative z-10 flex w-full max-w-2xl flex-1 flex-col px-5 pt-12 pb-24 sm:px-8 sm:pt-8 sm:pb-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("editor.title")}</h1>
            <p className="text-sm text-white/50">{t("editor.quizLibrary")}</p>
          </div>
          <button
            onClick={handleCreate}
            className="btn-primary flex min-h-[44px] items-center gap-2 !px-5 !py-0 !text-base"
          >
            <Plus className="h-4 w-4" />
            {t("editor.create")}
          </button>
        </div>

        {/* Quiz list */}
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading quizzes">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border-[1.5px] border-white/8 px-5 py-4">
                <div className="skeleton h-11 w-11 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 flex justify-center">
              <FileText className="h-16 w-16 text-white/25" strokeWidth={1.5} />
            </div>
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
                className="flex items-center gap-4 rounded-2xl border-[1.5px] border-white/8 bg-white/5 px-5 py-4"
              >
                {(() => {
                  const theme = getQuizTheme(quiz);
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
                    aria-label={`Edit ${quiz.title}`}
                    className="tap-target rounded-lg bg-white/5 text-white/60 hover:bg-white/20 hover:text-white/80"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setPendingDelete(quiz)}
                    disabled={deleting === quiz.id}
                    aria-label={`Delete ${quiz.title}`}
                    className="tap-target rounded-lg bg-white/5 text-red-400/60 hover:bg-[#ff716c]/20 hover:text-red-400 disabled:opacity-50"
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

        {error && (
          <p role="alert" className="mt-4 rounded-xl border-[1.5px] border-[#ff716c]/30 bg-[#ff716c]/10 px-4 py-3 text-sm text-[#ff716c]">
            {error}
          </p>
        )}

        <ConfirmDialog
          open={pendingDelete !== null}
          title="Delete this quiz?"
          message={pendingDelete ? `"${pendingDelete.title}" and its ${pendingDelete.questionCount} questions will be removed. This cannot be undone.` : undefined}
          confirmLabel="Delete"
          destructive
          busy={deleting !== null}
          onConfirm={() => pendingDelete && runDelete(pendingDelete.id)}
          onCancel={() => setPendingDelete(null)}
        />

        <EditorUnlock
          open={authPrompt !== null}
          reason={authPrompt ?? undefined}
          onUnlocked={() => setAuthPrompt(null)}
          onCancel={() => setAuthPrompt(null)}
        />

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
