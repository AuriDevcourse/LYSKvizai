"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Loader2 } from "lucide-react";
import type { Question, Quiz } from "@/data/types";
import QuestionEditor from "@/components/editor/QuestionEditor";
import { useTranslation } from "@/lib/i18n/LanguageContext";

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
  const { t } = useTranslation();
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
        if (!res.ok) throw new Error("Quiz not found");
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
      setError(t("editor.enterTitle"));
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
      setError(t("editor.invalidTitle"));
      return;
    }

    // Filter out empty questions
    const validQuestions = questions.filter(
      (q) => q.question.trim() && q.options.some((o) => o.trim())
    );
    if (validQuestions.length === 0) {
      setError(t("editor.addOneQuestion"));
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
        throw new Error(data.error || "Error saving");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      if (isNew) {
        router.replace(`/editor/${finalId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
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
      <div className="flex min-h-svh items-center justify-center bg-[#0e0e0e] bg-pattern">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (error && !title && !isNew) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0e0e0e] bg-pattern">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">😵</div>
          <p className="text-lg text-white">{error}</p>
          <button
            onClick={() => router.push("/editor")}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-[#ff9062] hover:bg-white/90"
          >
            {t("nav.back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-[#0e0e0e] bg-pattern">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.07] blur-3xl" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-red-500/[0.05] blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/editor")}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("nav.back")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-semibold text-[#ff9062] transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? t("editor.saved") : t("editor.save")}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[#e21b3c]/20 px-4 py-2 text-sm text-white">
            {error}
          </div>
        )}

        {/* Metadata */}
        <div className="mb-6 space-y-4 rounded-2xl border-2 border-white/15 bg-white/5 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">
              {t("editor.quizTitle")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border-2 border-white/15 bg-white/5 px-3 py-2 text-lg font-bold text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
              placeholder={t("editor.quizTitlePlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">
              {t("editor.description")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border-2 border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
              placeholder={t("editor.descriptionPlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">
              {t("editor.emoji")}
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-colors ${
                    emoji === e
                      ? "bg-white/15 ring-2 ring-white"
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
        <h2 className="mb-4 text-lg font-bold text-white">
          {t("editor.questions")} ({questions.length})
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
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 py-4 text-white/50 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white/80"
        >
          <Plus className="h-5 w-5" />
          {t("editor.addQuestion")}
        </button>

        {/* Bottom save */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-[#ff9062] transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? t("editor.saved") : t("editor.saveQuiz")}
          </button>
        </div>
      </main>
    </div>
  );
}
