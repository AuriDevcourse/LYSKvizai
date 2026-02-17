"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Loader2 } from "lucide-react";
import type { Question, Quiz } from "@/data/types";
import QuestionEditor from "@/components/editor/QuestionEditor";

const EMPTY_QUESTION: Question = {
  question: "",
  options: ["", "", "", ""],
  correct: 0,
  explanation: "",
};

const EMOJI_OPTIONS = ["🎭", "📝", "🧠", "🌍", "🎬", "🏆", "🔬", "📚", "🎵", "⚽", "🍕", "🐱"];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QuizEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === "new";

  const [quizId, setQuizId] = useState(isNew ? "" : id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📝");
  const [questions, setQuestions] = useState<Question[]>([{ ...EMPTY_QUESTION }]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Load existing quiz
  useEffect(() => {
    if (isNew) return;
    fetch(`/api/quizzes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Kvizas nerastas");
        return res.json();
      })
      .then((quiz: Quiz) => {
        setQuizId(quiz.id);
        setTitle(quiz.title);
        setDescription(quiz.description);
        setEmoji(quiz.emoji);
        setQuestions(quiz.questions);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleSave = useCallback(async () => {
    // Validation
    if (!title.trim()) {
      setError("Įvesk pavadinimą");
      return;
    }
    const finalId = isNew
      ? title
          .toLowerCase()
          .replace(/[ąčęėįšųūž]/g, (c) => {
            const map: Record<string, string> = { ą: "a", č: "c", ę: "e", ė: "e", į: "i", š: "s", ų: "u", ū: "u", ž: "z" };
            return map[c] || c;
          })
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
      : quizId;

    if (!finalId) {
      setError("Netinkamas pavadinimas ID generavimui");
      return;
    }

    // Filter out empty questions
    const validQuestions = questions.filter(
      (q) => q.question.trim() && q.options.some((o) => o.trim())
    );
    if (validQuestions.length === 0) {
      setError("Pridėk bent vieną klausimą");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/quizzes" : `/api/quizzes/${finalId}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: finalId,
          title: title.trim(),
          description: description.trim(),
          emoji,
          questions: validQuestions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Klaida išsaugant");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      if (isNew) {
        router.replace(`/editor/${finalId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Klaida");
    } finally {
      setSaving(false);
    }
  }, [isNew, quizId, title, description, emoji, questions, router]);

  const addQuestion = () => {
    setQuestions([...questions, { ...EMPTY_QUESTION }]);
  };

  const updateQuestion = (index: number, updated: Question) => {
    const next = [...questions];
    next[index] = updated;
    setQuestions(next);
  };

  const deleteQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next);
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0f0e0a]">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error && !title && !isNew) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0f0e0a]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">😵</div>
          <p className="text-lg text-red-300">{error}</p>
          <button
            onClick={() => router.push("/editor")}
            className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-amber-950 hover:bg-amber-400"
          >
            Grįžti
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-[#0f0e0a]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-red-500/[0.05] blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/editor")}
            className="flex items-center gap-1.5 text-sm text-amber-200/40 hover:text-amber-200/60"
          >
            <ArrowLeft className="h-4 w-4" />
            Atgal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-semibold text-amber-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? "Išsaugota!" : "Išsaugoti"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-400/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Metadata */}
        <div className="mb-6 space-y-4 rounded-2xl border-2 border-white/10 bg-white/5 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-amber-200/50">
              Pavadinimas
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border-2 border-white/10 bg-white/5 px-3 py-2 text-lg font-bold text-amber-50 placeholder:text-amber-200/30 focus:border-amber-400/50 focus:outline-none"
              placeholder="Kvizo pavadinimas"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-amber-200/50">
              Aprašymas
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border-2 border-white/10 bg-white/5 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/30 focus:border-amber-400/50 focus:outline-none"
              placeholder="Trumpas aprašymas..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-amber-200/50">
              Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-colors ${
                    emoji === e
                      ? "bg-amber-400/20 ring-2 ring-amber-400"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Questions */}
        <h2 className="mb-4 text-lg font-bold text-amber-50">
          Klausimai ({questions.length})
        </h2>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <QuestionEditor
              key={i}
              question={q}
              index={i}
              total={questions.length}
              onChange={(updated) => updateQuestion(i, updated)}
              onDelete={() => deleteQuestion(i)}
              onMoveUp={() => moveQuestion(i, -1)}
              onMoveDown={() => moveQuestion(i, 1)}
            />
          ))}
        </div>

        {/* Add question button */}
        <button
          onClick={addQuestion}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 py-4 text-amber-200/50 transition-colors hover:border-amber-400/30 hover:bg-amber-400/5 hover:text-amber-200"
        >
          <Plus className="h-5 w-5" />
          Pridėti klausimą
        </button>

        {/* Bottom save */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3 font-semibold text-amber-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? "Išsaugota!" : "Išsaugoti kvizą"}
          </button>
        </div>
      </main>
    </div>
  );
}
