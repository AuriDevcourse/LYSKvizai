import type { Question, QuestionType } from "@/data/types";

/** Derive subject name from image path: "/quiz-images/polar-bear.jpg" → "polar bear" */
function deriveSubjectFromImage(imagePath: string): string | null {
  const match = imagePath.match(/\/([^/]+)\.\w+$/);
  if (!match) return null;
  return match[1].replace(/-/g, " ");
}

/** Images that don't work well for zoom-out (abstract, satellite views, maps, etc.) */
const BAD_ZOOM_SUBJECTS = new Set([
  "antarctica", "earth", "dry-valleys", "earthquake", "glacier",
  "taiga", "rainbow",
]);

/** Check if an image is suitable for zoom-out guessing */
function isGoodZoomImage(imagePath: string): boolean {
  const match = imagePath.match(/\/([^/]+)\.\w+$/);
  if (!match) return false;
  return !BAD_ZOOM_SUBJECTS.has(match[1]);
}

/** Check if an answer is short/simple enough for free-text typing (≤3 words, ≤25 chars) */
function canBeTyped(answer: string): boolean {
  const trimmed = answer.trim();
  if (!trimmed) return false;
  if (trimmed.length > 25) return false;
  if (trimmed.split(/\s+/).length > 3) return false;
  return true;
}

/**
 * Transform a standard question into the specified game type format.
 * Questions that already have the target type are returned as-is.
 */
export function transformQuestion(q: Question, targetType: QuestionType | "mixed"): Question {
  const currentType = q.type ?? "standard";

  // If question already matches target type, return as-is
  if (targetType === currentType) return q;

  // Mixed: randomly assign a type (respecting what the question can support)
  if (targetType === "mixed") {
    const types: QuestionType[] = ["standard", "true-false"];
    const correctText = q.options[q.correct];
    if (canBeTyped(correctText)) types.push("fastest-finger");
    if (q.correctYear != null) types.push("year-guesser");
    const picked = types[Math.floor(Math.random() * types.length)];
    return transformQuestion(q, picked);
  }

  // Year-guesser: can only work if question already has correctYear
  if (targetType === "year-guesser") {
    if (q.correctYear != null) return { ...q, type: "year-guesser" };
    // Fall back to standard if no year data
    return q;
  }

  // True/False: convert multi-choice into a statement
  if (targetType === "true-false") {
    return convertToTrueFalse(q);
  }

  // Zoom-out: requires a good, identifiable image
  if (targetType === "zoom-out") {
    if (q.image && isGoodZoomImage(q.image)) {
      // If the question already has acceptedAnswers, use those (purpose-built zoom-out)
      if (q.acceptedAnswers) {
        return { ...q, question: "?", type: "zoom-out" };
      }
      // Derive the subject from the image filename
      const subject = deriveSubjectFromImage(q.image);
      const correctText = q.options[q.correct];
      const answers = subject
        ? [subject, correctText]
        : [correctText];
      return {
        ...q,
        question: "?",
        type: "zoom-out",
        acceptedAnswers: answers,
      };
    }
    // Bad image or no image — keep as standard
    return q;
  }

  // Fastest-finger: only for short, simple answers (≤3 words, no special formatting)
  if (targetType === "fastest-finger") {
    const correctText = q.options[q.correct];
    if (canBeTyped(correctText)) {
      return {
        ...q,
        type: "fastest-finger",
        acceptedAnswers: [correctText],
      };
    }
    // Answer too complex to type — keep as standard
    return q;
  }

  return q;
}

function convertToTrueFalse(q: Question): Question {
  const correctAnswer = q.options[q.correct];
  const wrongAnswers = q.options.filter((_, i) => i !== q.correct && q.options[i] !== "");

  // Randomly decide: show a TRUE statement or a FALSE statement
  const showTrue = Math.random() < 0.5;

  if (showTrue) {
    // Statement using the correct answer — answer is True (index 0)
    return {
      ...q,
      question: `${q.question}\n→ ${correctAnswer}`,
      options: ["True", "False", "", ""],
      correct: 0,
      type: "true-false",
    };
  } else {
    // Statement using a wrong answer — answer is False (index 1)
    const wrongAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)] || correctAnswer;
    return {
      ...q,
      question: `${q.question}\n→ ${wrongAnswer}`,
      options: ["True", "False", "", ""],
      correct: 1,
      type: "true-false",
      // Keep explanation pointing to the real answer
      explanation: `${q.explanation} (${correctAnswer})`,
    };
  }
}

/**
 * Transform an array of questions for a given game type.
 */
export function transformQuestions(questions: Question[], gameType: string): Question[] {
  if (!gameType || gameType === "standard") return questions;
  return questions.map((q) => transformQuestion(q, gameType as QuestionType | "mixed"));
}
