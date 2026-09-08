"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Clock, ArrowRight, Trophy } from "lucide-react";
import type { Question } from "@/data/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { fuzzyMatch } from "@/lib/fuzzy-match";
import { ANSWER_BG, ANSWER_ICONS, ANSWER_TEXT } from "@/lib/answer-options";

interface QuizCardProps {
  question: Question;
  questionNumber: number;
  selectedAnswer: number | null;
  onSelect: (index: number) => void;
  onNext: () => void;
  isLast: boolean;
}

/*
 * Solo mode's answer buttons, from the shared palette.
 *
 * These used to re-spell all four colours and their icons, which is exactly
 * the duplication `answer-options.ts` was created to end — the multiplayer
 * screens had already been consolidated, so solo mode was one edit away from
 * drifting out of step with them.
 *
 * The `hover:brightness-110` that used to live here is also gone: `.answer-btn`
 * already applies `filter: brightness(1.15)` on hover *and* turns it off under
 * `prefers-reduced-motion`. The Tailwind copy fought it and skipped the guard.
 */
const COLORS = ANSWER_BG.map((bg, i) => ({ bg, icon: ANSWER_ICONS[i] }));

/** True/false reuses green for yes and red for no. */
const TF_COLORS = [
  { bg: ANSWER_BG[2], icon: Check },
  { bg: ANSWER_BG[0], icon: X },
];

export default function QuizCard({
  question,
  // Unused: the card shows progress from `question`/`total` instead.
  questionNumber: _questionNumber,
  selectedAnswer,
  onSelect,
  onNext,
  isLast,
}: QuizCardProps) {
  const { t } = useTranslation();
  const qText = question.question;
  const qOptions = question.options;
  const qExplanation = question.explanation;
  const answered = selectedAnswer !== null;
  const questionType = question.type ?? "standard";
  const isTrueFalse = questionType === "true-false";
  const isYearGuesser = questionType === "year-guesser";
  const isFastestFinger = questionType === "fastest-finger";
  const isZoomOut = questionType === "zoom-out";
  const isTextInput = isFastestFinger || isZoomOut;

  // Year guesser state — slider range
  const YEAR_MIN = 1800;
  const YEAR_MAX = 2030;
  const correctYear = question.correctYear ?? 2000;
  const yearRange = YEAR_MAX - YEAR_MIN;
  const [yearGuess, setYearGuess] = useState(Math.round((YEAR_MIN + YEAR_MAX) / 2));
  // Fastest finger state
  const [textAnswer, setTextAnswer] = useState("");
  const ffStartTime = useRef<number>(0);
  const [ffResponseTime, setFfResponseTime] = useState<number | null>(null);
  const [lastQText, setLastQText] = useState(question.question);

  // Reset response state when question changes (adjust-state-on-render)
  if (lastQText !== question.question) {
    setLastQText(question.question);
    setFfResponseTime(null);
  }

  // Record fastest-finger clock when question shows
  useEffect(() => {
    ffStartTime.current = Date.now();
  }, [question.question]);

  const isCorrectStandard = selectedAnswer === question.correct;

  // Year guesser scoring: 10% of range = threshold for any points
  const yearDiff = isYearGuesser ? Math.abs(yearGuess - correctYear) : 0;
  const yearThreshold = yearRange * 0.1; // 10% of range = ~23 years
  const yearAccuracy = isYearGuesser ? Math.max(0, 1 - yearDiff / yearThreshold) : 0;
  const isYearCorrect = yearDiff === 0;
  const yearGotPoints = yearAccuracy > 0;

  // Text input correctness (fuzzy — allows typos) — used by fastest-finger and zoom-out
  const acceptedAnswers = question.acceptedAnswers ?? [question.options[question.correct]];
  const isTextCorrect = fuzzyMatch(textAnswer, acceptedAnswers);

  // Zoom-out animation: starts at 6x, shrinks to 1x over 15 seconds
  const ZOOM_DURATION = 15;
  const [zoomScale, setZoomScale] = useState(6);
  const zoomRafRef = useRef<number>(0);
  const [zoomTracked, setZoomTracked] = useState({ q: question.question, answered, isZoomOut });

  // Reset zoom scale when question or answered/zoom mode changes (adjust-state-on-render)
  if (
    zoomTracked.q !== question.question ||
    zoomTracked.answered !== answered ||
    zoomTracked.isZoomOut !== isZoomOut
  ) {
    setZoomTracked({ q: question.question, answered, isZoomOut });
    if (isZoomOut) setZoomScale(answered ? 1 : 6);
  }

  useEffect(() => {
    if (!isZoomOut || answered) {
      cancelAnimationFrame(zoomRafRef.current);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const fraction = Math.min(elapsed / ZOOM_DURATION, 1);
      setZoomScale(6 - 5 * fraction);
      if (fraction < 1) zoomRafRef.current = requestAnimationFrame(tick);
    };
    zoomRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(zoomRafRef.current);
  }, [isZoomOut, question.question, answered]);

  const isCorrect = isYearGuesser ? yearGotPoints : isTextInput ? isTextCorrect : isCorrectStandard;

  const handleYearSubmit = () => {
    if (answered) return;
    /*
     * Report the same verdict the card is about to display.
     *
     * This passed `isYearCorrect`, which is an *exact* year match, while the
     * card showed `yearGotPoints` (within 10% of the range, about 23 years) as
     * correct. So a near miss got a congratulatory banner quoting a percentage
     * of points, and scored nothing. The banner was advertising credit the game
     * never awarded.
     */
    onSelect(yearGotPoints ? question.correct : -1);
  };

  /*
   * Keyboard play: 1-4 pick an answer, Enter or Space advances.
   *
   * Solo mode is mostly played on a desktop with a keyboard in front of it, and
   * there was no key binding anywhere except Enter inside the text input. The
   * number keys match the on-screen order, so the shape and colour a player
   * already reads as "the second one" is the one 2 selects.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Never hijack typing, and leave modified keys to the browser.
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (answered) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNext(); }
        return;
      }
      if (isYearGuesser || isTextInput) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > qOptions.length) return;
      const option = qOptions[n - 1];
      // True/false renders only the options that exist; skip the empty slots.
      if (isTrueFalse && !option) return;
      e.preventDefault();
      onSelect(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, onNext, onSelect, isYearGuesser, isTextInput, isTrueFalse, qOptions]);

  const handleTextSubmit = () => {
    if (answered || !textAnswer.trim()) return;
    setFfResponseTime((Date.now() - ffStartTime.current) / 1000);
    onSelect(isTextCorrect ? question.correct : -1);
  };

  return (
    <div className="animate-fade-in-up w-full">
      {/* Question — hidden for zoom-out (image IS the question) */}
      {!isZoomOut && (
        <div className="glass mb-4 rounded-2xl px-5 py-4 text-center sm:mb-6 sm:px-6 sm:py-5">
          <h2 className="font-headline text-lg font-extrabold leading-snug text-white sm:text-2xl sm:leading-relaxed">
            {qText}
          </h2>
        </div>
      )}

      {/* Image */}
      {question.image && (
        <div className={`mb-4 overflow-hidden rounded-2xl sm:mb-6 ${isZoomOut ? "h-48 sm:h-80" : ""} relative bg-white/5`}>
          <img
            src={question.image}
            alt=""
            className={`w-full object-cover transition-transform duration-200 ease-out ${isZoomOut ? "h-full" : "h-36 sm:h-48"}`}
            style={isZoomOut ? { transform: `scale(${zoomScale})` } : undefined}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      {/* Year Guesser — Slider */}
      {isYearGuesser && (
        <div className="flex flex-col items-center gap-5">
          <span className="font-headline text-6xl font-black text-white">{yearGuess}</span>
          <div className="w-full max-w-md px-2">
            <input
              type="range"
              min={YEAR_MIN}
              max={YEAR_MAX}
              value={yearGuess}
              onChange={(e) => !answered && setYearGuess(Number(e.target.value))}
              disabled={answered}
              className="year-slider w-full"
            />
            <div className="mt-1 flex justify-between text-xs font-bold text-white/50">
              <span>{YEAR_MIN}</span>
              <span>{YEAR_MAX}</span>
            </div>
          </div>
          {!answered && (
            <button
              onClick={handleYearSubmit}
              className="btn-primary w-full max-w-xs text-center"
            >
              {t("quizCard.submit")}
            </button>
          )}
        </div>
      )}

      {/* Text input — Fastest Finger & Zoom Out */}
      {isTextInput && (
        <div className="flex flex-col items-center gap-4">
          <input
            type="text"
            value={textAnswer}
            onChange={(e) => !answered && setTextAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
            disabled={answered}
            autoFocus
            placeholder={t("quizCard.typeAnswer")}
            className="w-full max-w-md rounded-2xl border-[1.5px] border-white/8 bg-white/5 px-5 py-4 text-center text-xl font-bold text-white placeholder:text-white/45 focus:border-white/50 focus:outline-none disabled:opacity-60"
          />
          {!answered && (
            <button
              onClick={handleTextSubmit}
              disabled={!textAnswer.trim()}
              className="btn-primary w-full max-w-xs text-center disabled:opacity-40"
            >
              {t("quizCard.submit")}
            </button>
          )}
        </div>
      )}

      {/* Standard / True-False / Bluff / Audio / Video answer grid */}
      {!isYearGuesser && !isTextInput && (
        <div className={`grid gap-3 stagger-children grid-cols-2`}>
          {qOptions.map((option, i) => {
            if (isTrueFalse && !option) return null;
            const { bg, icon: Icon } = isTrueFalse ? TF_COLORS[i] : COLORS[i];
            const isThis = i === selectedAnswer;
            const isCorrectAnswer = i === question.correct;

            /*
             * `ANSWER_TEXT` (near-black), not white. White measures 2.30 to
             * 2.68:1 against the four answer colours, under even the 3:1
             * large-text floor; near-black measures 7.2 to 8.4:1. CLAUDE.md
             * documents this and `answer-options.ts` exists to stop it, but
             * this file imported the backgrounds and icons and left the text
             * behind, so solo mode drifted while the multiplayer screens were
             * fixed.
             */
            let classes = `answer-btn relative flex items-center gap-3 rounded-2xl px-4 py-5 text-left font-bold ${ANSWER_TEXT} transition-all sm:py-6 ${bg}`;

            if (answered) {
              if (isCorrectAnswer) {
                classes += " outline outline-2 outline-primary scale-[1.02]";
              } else if (isThis) {
                classes += " opacity-60 grayscale";
              } else {
                classes += " opacity-30";
              }
            }

            return (
              <button
                key={i}
                onClick={() => !answered && onSelect(i)}
                disabled={answered}
                className={classes}
              >
                <Icon className="h-6 w-6 shrink-0" {...(isTrueFalse ? { strokeWidth: 3 } : { fill: "currentColor" })} />
                <span className="text-sm leading-tight break-words sm:text-base">{option}</span>
                {/*
                  * The key that picks this answer. Shown from `sm` up, where
                  * there is a keyboard to press it — a shortcut nobody can see
                  * is half a feature. Hidden once answered, since the row then
                  * carries a tick or a cross in the same corner.
                  */}
                {!answered && (
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-3 hidden text-xs font-extrabold opacity-45 sm:block"
                  >
                    {i + 1}
                  </span>
                )}
                {answered && isCorrectAnswer && (
                  <Check className="absolute right-3 top-3 h-5 w-5 animate-bounce-in" />
                )}
                {answered && isThis && !isCorrectAnswer && (
                  <X className="absolute right-3 top-3 h-5 w-5 animate-bounce-in" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/*
        * Feedback + Next, in a slot that is always present.
        *
        * This block used to mount only once answered, and the page centres its
        * content vertically, so appearing pushed everything up by 93px: the
        * button you had just clicked jumped out from under the cursor, every
        * single question. Reserving the height keeps the answers still.
        *
        * `min-h` rather than a fixed height, so a two-line banner (year-guesser
        * and the typed modes add a second row) can still grow rather than clip.
        */}
      <div className="mt-6 min-h-[172px]">
      {answered && (
        /*
         * `aria-live` so the verdict is announced. The banner appeared silently
         * before, which meant a screen-reader user was never told whether the
         * answer was right — the one thing the screen exists to say.
         */
        <div className="animate-slide-up" role="status" aria-live="polite">
          <div
            className={`rounded-2xl px-5 py-4 text-center font-bold ${
              isYearGuesser && yearGotPoints && !isYearCorrect
                ? `bg-answer-yellow ${ANSWER_TEXT}`
                : isCorrect
                  ? `bg-answer-green ${ANSWER_TEXT}`
                  : `bg-error ${ANSWER_TEXT}`
            }`}
          >
            <p className="flex items-center justify-center gap-2 text-lg">
              {isYearGuesser
                ? isYearCorrect
                  ? <>{t("quizCard.correct")} {correctYear} <Check className="h-5 w-5" /></>
                  : yearGotPoints
                    // One decimal, matching the scale game's accuracy readout.
                    ? `${(yearAccuracy * 100).toFixed(1)}% · Off by ${yearDiff} ${yearDiff === 1 ? "year" : "years"}`
                    : <>{t("quizCard.incorrect")} <X className="h-5 w-5" /></>
                : isCorrect
                  ? <>{t("quizCard.correct")} <Check className="h-5 w-5" /></>
                  : <>{t("quizCard.incorrect")} <X className="h-5 w-5" /></>}
            </p>
            {isYearGuesser && !isYearCorrect && (
              <p className="mt-1 text-sm font-medium opacity-80">
                {t("quizCard.correctAnswer")}: {correctYear}
              </p>
            )}
            {isTextInput && (
              <div className="mt-1 flex items-center justify-center gap-3 text-sm font-medium opacity-80">
                {ffResponseTime !== null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {ffResponseTime.toFixed(2)}s
                  </span>
                )}
                {!isTextCorrect && (
                  <span>{t("quizCard.correctAnswer")}: {acceptedAnswers[0]}</span>
                )}
              </div>
            )}
            <p className="mt-1 text-sm font-medium opacity-80">
              {qExplanation}
            </p>
          </div>

          <button
            onClick={onNext}
            className="btn-primary mt-4 flex w-full items-center justify-center gap-2"
          >
            {isLast ? <>{t("quizCard.results")} <Trophy className="h-5 w-5" /></> : <>{t("quizCard.next")} <ArrowRight className="h-5 w-5" /></>}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
