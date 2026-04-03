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
export function isGoodZoomImage(imagePath: string): boolean {
  // External URLs (Wikipedia etc.) are unreliable — rate limited, may 429
  if (imagePath.startsWith("http")) return false;
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
    if (q.image && isGoodZoomImage(q.image)) types.push("zoom-out");
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

/**
 * Build a natural True/False statement from a question + answer.
 * E.g. "Which country has the most time zones?" + "France"
 *   → "The country with the most time zones is France."
 * "What is the largest ocean?" + "Pacific Ocean"
 *   → "The largest ocean is the Pacific Ocean."
 */
function buildTrueFalseStatement(question: string, answer: string): string {
  const q = question.trim().replace(/\?$/, "").trim();

  // "What is / What are / What was" → "The X is answer"
  const whatIs = q.match(/^what\s+(?:is|are|was|were)\s+(.+)/i);
  if (whatIs) {
    const subject = capitalize(whatIs[1]);
    return `${subject} is ${answer}.`;
  }

  // "Which X is/has/does..." → "The X is/has/does... answer"
  const whichIs = q.match(/^which\s+(.+?)\s+(is|are|was|were|has|had|does|did|can|could)\s+(.+)/i);
  if (whichIs) {
    return `The ${whichIs[1]} that ${whichIs[2]} ${whichIs[3]} is ${answer}.`;
  }

  // "Which X verb..." → "The X that verb... is answer"
  const whichWhat = q.match(/^(?:which|what)\s+(.+)/i);
  if (whichWhat) {
    return `The ${whichWhat[1]} is ${answer}.`;
  }

  // "Who is/was..." → "Answer is/was..."
  const whoIs = q.match(/^who\s+(is|are|was|were)\s+(.+)/i);
  if (whoIs) {
    return `${answer} ${whoIs[1]} ${whoIs[2]}.`;
  }

  // "Who verb..." → "Answer verb..."
  const whoVerb = q.match(/^who\s+(.+)/i);
  if (whoVerb) {
    return `${answer} ${whoVerb[1]}.`;
  }

  // "How many X does/are..." → "There are answer X..."
  const howMany = q.match(/^how\s+many\s+(.+)/i);
  if (howMany) {
    return `There are ${answer} ${howMany[1]}.`;
  }

  // "How much is X" → "X is answer"
  const howMuch = q.match(/^how\s+much\s+(?:is|are|was|were|does)\s+(.+)/i);
  if (howMuch) {
    return `${capitalize(howMuch[1])} is ${answer}.`;
  }

  // "Where is/was..." → "Answer is in/at..."
  const whereIs = q.match(/^where\s+(?:is|are|was|were)\s+(.+)/i);
  if (whereIs) {
    return `${capitalize(whereIs[1])} is located in ${answer}.`;
  }

  // "When did/was..." → "... happened in answer"
  const whenMatch = q.match(/^when\s+(?:did|was|were|is)\s+(.+)/i);
  if (whenMatch) {
    return `${capitalize(whenMatch[1])} was in ${answer}.`;
  }

  // "In which..." → "The answer is answer"
  const inWhich = q.match(/^in\s+which\s+(.+)/i);
  if (inWhich) {
    return `The ${inWhich[1]} is ${answer}.`;
  }

  // Fallback: simple declarative
  return `${capitalize(q.replace(/^(is|are|was|were|do|does|did|can|could|has|had|have)\s+/i, ""))} is ${answer}.`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
      question: buildTrueFalseStatement(q.question, correctAnswer),
      options: ["True", "False", "", ""],
      correct: 0,
      type: "true-false",
    };
  } else {
    // Statement using a wrong answer — answer is False (index 1)
    const wrongAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)] || correctAnswer;
    return {
      ...q,
      question: buildTrueFalseStatement(q.question, wrongAnswer),
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
 * For zoom-out: only include questions that have suitable images.
 * For year-guesser: only include questions with correctYear data.
 */
export function transformQuestions(questions: Question[], gameType: string): Question[] {
  if (!gameType || gameType === "standard") return questions;

  // Pre-filter: remove questions that can't work with the target type
  let filtered = questions;
  if (gameType === "zoom-out") {
    filtered = questions.filter((q) => q.image && isGoodZoomImage(q.image));
  } else if (gameType === "year-guesser") {
    filtered = questions.filter((q) => q.correctYear != null);
  } else if (gameType === "fastest-finger") {
    filtered = questions.filter((q) => canBeTyped(q.options[q.correct]));
  }

  // If filtering removed everything, fall back to all questions as standard
  if (filtered.length === 0) return questions;

  return filtered.map((q) => transformQuestion(q, gameType as QuestionType | "mixed"));
}
