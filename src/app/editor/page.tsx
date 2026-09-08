"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Pencil, ArrowLeft, Loader2, FileText, Library as LibraryIcon, Search, Copy } from "lucide-react";
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

  /**
   * 6.6 — a search box over the quiz list.
   *
   * `/library` searches question *text* across every quiz, which is a
   * different job; finding a quiz by name in a list of 54 still meant
   * scrolling. Matches title and id, so `bluff` finds all five bluff sets.
   */
  const [query, setQuery] = useState("");
  const visibleQuizzes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter(
      (quiz) => quiz.title.toLowerCase().includes(q) || quiz.id.toLowerCase().includes(q)
    );
  }, [quizzes, query]);

  /**
   * 6.4 — duplicate a quiz.
   *
   * Building a 15-question variant of an existing set meant retyping all
   * fifteen. Copies the questions into a new quiz and opens it for editing.
   */
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const runDuplicate = async (meta: QuizMeta) => {
    setDuplicating(meta.id);
    setError(null);
    try {
      const source = await fetch(`/api/quizzes/${meta.id}`).then((r) => {
        if (!r.ok) throw new Error("Could not read that quiz");
        return r.json();
      });
      const res = await editorFetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${source.title} (copy)`,
          description: source.description,
          icon: source.icon,
          questions: source.questions,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not duplicate this quiz");
      }
      const created = await res.json();
      router.push(`/editor/${created.id}`);
    } catch (e) {
      if (e instanceof EditorAuthError) setAuthPrompt(e.message);
      else {
        console.error("Duplicate failed", e);
        setError(e instanceof Error ? e.message : "Could not duplicate this quiz");
      }
    } finally {
      setDuplicating(null);
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center pb-24 sm:pb-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.07] blur-3xl" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-red-500/[0.05] blur-3xl" />
      </div>

      <main className="relative z-10 flex w-full max-w-2xl flex-1 flex-col px-5 pt-12 pb-24 sm:px-8 sm:pt-8 sm:pb-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold text-white">{t("editor.title")}</h1>
            <p className="text-sm text-white/50">{t("editor.quizLibrary")}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* The editor lists quizzes but never their contents. The library
                does, read-only, and needs no editor secret. */}
            <Link
              href="/library"
              className="btn-secondary flex min-h-[44px] items-center gap-2 !px-4 !py-0 !text-base"
            >
              <LibraryIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Library</span>
            </Link>
            <button
              onClick={handleCreate}
              className="btn-primary flex min-h-[44px] items-center gap-2 !px-5 !py-0 !text-base"
            >
              <Plus className="h-4 w-4" />
              {t("editor.create")}
            </button>
          </div>
        </div>

        {/* Search — 54 quizzes is too many to scroll for one name. Hidden
            while the list is short enough not to need it. */}
        {quizzes.length > 8 && (
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${quizzes.length} quizzes…`}
              aria-label="Search quizzes"
              className="min-h-[44px] w-full appearance-none rounded-xl border-[1.5px] border-white/8 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-white/45 focus:border-primary/50 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
        )}

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
        ) : visibleQuizzes.length === 0 && query ? (
          <p className="py-16 text-center text-white/50">No quiz matches that.</p>
        ) : quizzes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 flex justify-center">
              <FileText className="h-16 w-16 text-white/25" strokeWidth={1.5} />
            </div>
            <p className="text-lg text-white/50">{t("editor.noQuizzes")}</p>
            <p className="mt-1 text-sm text-white/45">
              {t("editor.getStarted")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center gap-4 rounded-2xl border-[1.5px] border-white/8 bg-white/5 px-5 py-4"
              >
                {(() => {
                  const theme = getQuizTheme(quiz);
                  const Icon = theme.icon;
                  return (
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.bg}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white">{quizTitles[quizzes.indexOf(quiz)]}</h3>
                  <p className="text-sm text-white/50">
                    {quiz.questionCount} questions
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => runDuplicate(quiz)}
                    disabled={duplicating === quiz.id}
                    aria-label={`Duplicate ${quiz.title}`}
                    title="Duplicate"
                    className="tap-target rounded-lg bg-white/5 text-white/60 hover:bg-white/20 hover:text-white/80 disabled:opacity-50"
                  >
                    {duplicating === quiz.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
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
                    className="tap-target rounded-lg bg-white/5 text-red-400/60 hover:bg-error/20 hover:text-red-400 disabled:opacity-50"
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
          <p role="alert" className="mt-4 rounded-xl border-[1.5px] border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
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
          className="tap-target mt-8 flex items-center gap-1.5 self-center px-3 text-sm text-white/50 hover:text-white/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("nav.backToHome")}
        </Link>
      </main>
    </div>
  );
}
