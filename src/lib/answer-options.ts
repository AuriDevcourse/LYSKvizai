import { Triangle, Diamond, Circle, Square } from "lucide-react";

/**
 * The four answer options: one colour and one shape each, in display order.
 *
 * This exists because the palette was copy-pasted into four components and had
 * drifted apart. The host screen showed answer B in #43a5fc while the player's
 * phone showed the same answer in #3a8fd9, and the results distribution chart
 * had the whole array shifted by one — so a blue answer got a green bar.
 *
 * The colour *is* the answer's identity in a game like this; players call out
 * "the blue one" across a room. One definition, imported everywhere.
 */
export const ANSWER_COLORS = ["#ff716c", "#43a5fc", "#66bb6a", "#c9a825"] as const;

/** Tailwind background classes, same order. */
export const ANSWER_BG = [
  "bg-error",
  "bg-secondary",
  "bg-answer-green",
  "bg-answer-yellow",
] as const;

/** Dimmed variants for options that weren't correct. */
export const ANSWER_BG_DIM = [
  "bg-error/30",
  "bg-secondary/30",
  "bg-answer-green/30",
  "bg-answer-yellow/30",
] as const;

/**
 * Text colour for content sitting ON an answer colour.
 *
 * These four backgrounds are bright, so white label text measured 2.30–2.68:1
 * against them — failing WCAG AA (4.5:1) and even the 3:1 large-text floor, on
 * the single most-read element in the game. Near-black measures 7.20–8.38:1.
 *
 * This also brings the answer chips in line with `btn-primary`, which CLAUDE.md
 * already specifies as black text on the orange gradient.
 */
export const ANSWER_TEXT = "text-background" as const;

/** Shape per option — the redundant channel for anyone who can't rely on colour. */
export const ANSWER_ICONS = [Triangle, Diamond, Circle, Square] as const;

/** Plain-text shape names, for screen readers and aria labels. */
export const ANSWER_SHAPE_NAMES = ["triangle", "diamond", "circle", "square"] as const;
