"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Pencil, ArrowLeft, Loader2 } from "lucide-react";
import type { QuizMeta } from "@/data/types";

export default function EditorPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchQuizzes = () => {
    fetch("/api/quizzes")
      .then((res) => res.json())
      .then((data) => setQuizzes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchQuizzes, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Tikrai nori ištrinti "${title}"?`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch {
      alert("Klaida trinant kvizą");
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = () => {
    router.push("/editor/new");
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center bg-[#0f0e0a]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-red-500/[0.05] blur-3xl" />
      </div>

      <main className="relative z-10 flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-50">Redaktorius</h1>
            <p className="text-sm text-amber-200/50">Kvizų biblioteka</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-semibold text-amber-950 transition-colors hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Sukurti
          </button>
        </div>

        {/* Quiz list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-5xl">📝</div>
            <p className="text-lg text-amber-200/50">Dar nėra kvizų</p>
            <p className="mt-1 text-sm text-amber-200/30">
              Paspausk &quot;Sukurti&quot; ir pradėk!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center gap-4 rounded-2xl border-2 border-white/10 bg-white/5 px-5 py-4"
              >
                <span className="text-3xl">{quiz.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-amber-50">{quiz.title}</h3>
                  <p className="text-sm text-amber-200/40">
                    {quiz.questionCount} klausimų
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/editor/${quiz.id}`}
                    className="rounded-lg bg-white/10 p-2 text-amber-200/60 hover:bg-white/20 hover:text-amber-200"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    disabled={deleting === quiz.id}
                    className="rounded-lg bg-white/10 p-2 text-red-400/60 hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50"
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
          className="mt-8 flex items-center gap-1.5 self-center text-sm text-amber-200/40 hover:text-amber-200/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Grįžti į pradžią
        </Link>
      </main>
    </div>
  );
}
