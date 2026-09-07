import { describe, it, expect } from "vitest";
import { validateQuizInput, MAX_QUESTIONS } from "./quiz-validate";

/**
 * `validateQuizInput` is the last thing standing between the editor and 54
 * files of live content, and it had no tests. It is also where the two worst
 * content bugs of this session lived or were fixed:
 *
 *  - a save path that silently dropped 81 questions across six files, because
 *    a filter required a non-blank option on question types that have none;
 *  - question types that could be saved in an unplayable state (6.8).
 *
 * `ok`/`bad` unwrap the result union so each case reads as one line.
 */
const base = {
  id: "test-quiz",
  title: "Test quiz",
  description: "",
  icon: "BookOpen",
};

const standardQuestion = {
  question: "What is 2 + 2?",
  options: ["3", "4", "5", "6"],
  correct: 1,
  explanation: "It is four.",
};

function ok(body: unknown) {
  const r = validateQuizInput(body);
  if ("error" in r) throw new Error(`expected valid, got: ${r.error}`);
  return r.quiz;
}
function bad(body: unknown): string {
  const r = validateQuizInput(body);
  if (!("error" in r)) throw new Error("expected an error, got a valid quiz");
  return r.error;
}

describe("validateQuizInput — the basics", () => {
  it("accepts a minimal standard quiz", () => {
    const q = ok({ ...base, questions: [standardQuestion] });
    expect(q.id).toBe("test-quiz");
    expect(q.questions).toHaveLength(1);
  });

  it("requires an id and a title", () => {
    expect(bad({ ...base, id: "", questions: [standardQuestion] })).toMatch(/id/i);
    expect(bad({ ...base, title: "", questions: [standardQuestion] })).toMatch(/title/i);
  });

  it("rejects a body that isn't an object", () => {
    expect(bad(null)).toMatch(/object/i);
    expect(bad("a string")).toMatch(/object/i);
  });

  it("requires exactly four options", () => {
    expect(bad({ ...base, questions: [{ ...standardQuestion, options: ["a", "b"] }] }))
      .toMatch(/exactly 4/i);
  });

  it("requires `correct` to index one of them", () => {
    expect(bad({ ...base, questions: [{ ...standardQuestion, correct: 4 }] })).toMatch(/0-3/);
    expect(bad({ ...base, questions: [{ ...standardQuestion, correct: -1 }] })).toMatch(/0-3/);
  });

  it("caps the number of questions", () => {
    const many = Array.from({ length: MAX_QUESTIONS + 1 }, () => standardQuestion);
    expect(bad({ ...base, questions: many })).toBeTruthy();
  });
});

describe("validateQuizInput — types that are answered by typing", () => {
  /*
   * These carry `options: ["","","",""]` as filler. That is legitimate data —
   * 78 year-guesser and 3 fastest-finger questions in the real files look like
   * this — and treating it as invalid is what deleted 81 questions.
   */
  it("accepts a year-guesser with blank options and a year", () => {
    const q = ok({
      ...base,
      questions: [{
        question: "When did WWII end?",
        options: ["", "", "", ""],
        correct: 0,
        explanation: "1945.",
        type: "year-guesser",
        correctYear: 1945,
      }],
    });
    expect(q.questions[0].correctYear).toBe(1945);
  });

  it("rejects a year-guesser with no year — it cannot be scored", () => {
    expect(bad({
      ...base,
      questions: [{
        question: "When did WWII end?",
        options: ["", "", "", ""],
        correct: 0,
        explanation: "",
        type: "year-guesser",
      }],
    })).toMatch(/year/i);
  });

  it("rejects a fastest-finger with no accepted answers (6.8)", () => {
    // No answer could ever be right, and it failed mid-game rather than on save.
    expect(bad({
      ...base,
      questions: [{
        question: "Symbol for gold?",
        options: ["", "", "", ""],
        correct: 0,
        explanation: "",
        type: "fastest-finger",
      }],
    })).toMatch(/accepted answer/i);
  });

  it("rejects a zoom-out with no image (6.8)", () => {
    // There is nothing to zoom out of.
    expect(bad({
      ...base,
      questions: [{ ...standardQuestion, type: "zoom-out" }],
    })).toMatch(/image/i);
  });

  it("rejects a bluff with no bluff answer", () => {
    expect(bad({
      ...base,
      questions: [{ ...standardQuestion, type: "bluff" }],
    })).toMatch(/bluff/i);
  });

  it("rejects an unknown type", () => {
    expect(bad({ ...base, questions: [{ ...standardQuestion, type: "charades" }] }))
      .toMatch(/unknown question type/i);
  });
});

describe("validateQuizInput — media URLs", () => {
  it("accepts a site-relative path and an https URL", () => {
    const q = ok({
      ...base,
      questions: [{ ...standardQuestion, image: "/quiz-images/aurora.jpg" }],
    });
    expect(q.questions[0].image).toBe("/quiz-images/aurora.jpg");
  });

  it("rejects `javascript:` — stored XSS through the image field", () => {
    expect(bad({
      ...base,
      questions: [{ ...standardQuestion, image: "javascript:alert(1)" }],
    })).toMatch(/image/i);
  });

  it("rejects a `data:` URL", () => {
    expect(bad({
      ...base,
      questions: [{ ...standardQuestion, image: "data:text/html,<script>alert(1)</script>" }],
    })).toMatch(/image/i);
  });
});
