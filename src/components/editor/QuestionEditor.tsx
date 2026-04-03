"use client";

import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import type { Question, QuestionType } from "@/data/types";
import ImageUpload from "./ImageUpload";
import MediaUpload from "./MediaUpload";

interface QuestionEditorProps {
  question: Question;
  index: number;
  total: number;
  onChange: (updated: Question) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "standard", label: "Standartinis" },
  { value: "bluff", label: "Apgaulė" },
  { value: "true-false", label: "Tiesa / Melas" },
  { value: "zoom-out", label: "Zoom Out" },
  { value: "fastest-finger", label: "Greičiausias" },
  { value: "year-guesser", label: "Metų spėjimas" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
];

export default function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: QuestionEditorProps) {
  const updateField = <K extends keyof Question>(key: K, value: Question[K]) => {
    if (key === "type") {
      const newType = value as QuestionType;
      const updated = { ...question, type: newType };
      // When switching to true-false, clear options C/D and ensure correct is 0 or 1
      if (newType === "true-false") {
        updated.options = [updated.options[0] || "Tiesa", updated.options[1] || "Melas", "", ""];
        if (updated.correct > 1) updated.correct = 0;
      }
      // When switching to year-guesser, set a default correctYear
      if (newType === "year-guesser" && !updated.correctYear) {
        updated.correctYear = 2000;
      }
      // When switching to fastest-finger, init acceptedAnswers
      if (newType === "fastest-finger" && !updated.acceptedAnswers) {
        updated.acceptedAnswers = [];
      }
      onChange(updated);
      return;
    }
    onChange({ ...question, [key]: value });
  };

  const updateOption = (optIndex: number, value: string) => {
    const newOptions = [...question.options] as [string, string, string, string];
    newOptions[optIndex] = value;
    onChange({ ...question, options: newOptions });
  };

  const questionType = question.type ?? "standard";

  return (
    <div className="rounded-2xl border-[1.5px] border-white/8 bg-white/5 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-white">
          {index + 1} klausimas
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white/80 disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white/80 disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-red-400/60 hover:bg-[#ff716c]/20 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Question type */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-white/50">
          Tipas
        </label>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map((qt) => (
            <button
              key={qt.value}
              type="button"
              onClick={() => updateField("type", qt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                questionType === qt.value
                  ? "bg-white/5 text-white/80"
                  : "bg-white/5 text-white/50 hover:bg-white/5"
              }`}
            >
              {qt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Question text */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-white/50">
          Klausimas
        </label>
        <textarea
          value={question.question}
          onChange={(e) => updateField("question", e.target.value)}
          rows={2}
          className="w-full rounded-lg border-[1.5px] border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
          placeholder="Įvesk klausimą..."
        />
      </div>

      {/* Bluff answer */}
      {questionType === "bluff" && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-purple-300/70">
            Apgaulės atsakymas
          </label>
          <input
            type="text"
            value={question.bluffAnswer ?? ""}
            onChange={(e) => updateField("bluffAnswer", e.target.value)}
            className="w-full rounded-lg border-2 border-purple-400/30 bg-purple-400/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-400/50 focus:outline-none"
            placeholder="Netikras atsakymas, kuris pakeis vieną iš neteisingų..."
          />
        </div>
      )}

      {/* Audio upload */}
      {questionType === "audio" && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-cyan-300/70">
            Audio failas
          </label>
          <MediaUpload
            type="audio"
            value={question.audioUrl}
            onChange={(url) => updateField("audioUrl", url)}
          />
        </div>
      )}

      {/* Video upload */}
      {questionType === "video" && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-cyan-300/70">
            Video failas / YouTube URL
          </label>
          <MediaUpload
            type="video"
            value={question.videoUrl}
            onChange={(url) => updateField("videoUrl", url)}
          />
        </div>
      )}

      {/* Year guesser: correct year */}
      {questionType === "year-guesser" && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-amber-300/70">
            Teisingi metai
          </label>
          <input
            type="number"
            value={question.correctYear ?? 2000}
            onChange={(e) => updateField("correctYear", parseInt(e.target.value) || 0)}
            className="w-40 rounded-lg border-2 border-amber-400/30 bg-amber-400/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-400/50 focus:outline-none"
            placeholder="pvz. 1990"
          />
        </div>
      )}

      {/* Fastest finger: accepted answers */}
      {questionType === "fastest-finger" && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-orange-300/70">
            Priimami atsakymai (po vieną eilutėje, be didžiųjų/mažųjų skirtumo)
          </label>
          <textarea
            value={(question.acceptedAnswers ?? []).join("\n")}
            onChange={(e) =>
              updateField(
                "acceptedAnswers",
                e.target.value.split("\n").filter((s) => s.trim())
              )
            }
            rows={3}
            className="w-full rounded-lg border-2 border-orange-400/30 bg-orange-400/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400/50 focus:outline-none"
            placeholder={"Vilnius\nvilnius city"}
          />
        </div>
      )}

      {/* Zoom-out hint */}
      {questionType === "zoom-out" && !question.image && (
        <div className="mb-4 rounded-lg border-2 border-yellow-400/30 bg-yellow-400/5 px-3 py-2 text-xs text-yellow-300/70">
          ⚠ Zoom Out klausimui reikia nuotraukos, pridėk ją žemiau
        </div>
      )}

      {/* Options + correct answer */}
      {questionType !== "year-guesser" && questionType !== "fastest-finger" && (
      <div className="mb-4 space-y-2">
        <label className="block text-xs font-medium text-white/50">
          Atsakymai (pasirink teisingą)
        </label>
        {question.options.map((opt, i) => {
          // For true-false, only show 2 options
          if (questionType === "true-false" && i > 1) return null;
          return (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateField("correct", i)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                question.correct === i
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-white/5 text-white/50 hover:bg-white/20"
              }`}
            >
              {["A", "B", "C", "D"][i]}
            </button>
            <input
              type="text"
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              className="flex-1 rounded-lg border-[1.5px] border-white/8 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
              placeholder={questionType === "true-false" ? (i === 0 ? "Tiesa" : "Melas") : `Atsakymas ${["A", "B", "C", "D"][i]}`}
            />
          </div>
          );
        })}
      </div>
      )}

      {/* Explanation */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-white/50">
          Paaiškinimas
        </label>
        <textarea
          value={question.explanation}
          onChange={(e) => updateField("explanation", e.target.value)}
          rows={2}
          className="w-full rounded-lg border-[1.5px] border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
          placeholder="Paaiškinimas rodomas po atsakymo..."
        />
      </div>

      {/* Image */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-white/50">
          Nuotrauka (neprivaloma)
        </label>
        <ImageUpload
          value={question.image}
          onChange={(url) => updateField("image", url)}
        />
      </div>

      {/* Progressive reveal toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={question.progressiveReveal ?? false}
            onChange={(e) => updateField("progressiveReveal", e.target.checked || undefined)}
            className="h-4 w-4 rounded accent-white"
          />
          <span className="text-xs font-medium text-white/50">
            Laipsniškas atskleidimas (tekstas žodis po žodžio, nuotrauka iš sulietos)
          </span>
        </label>
      </div>
    </div>
  );
}
