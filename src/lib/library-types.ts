import type { QuestionType } from "@/data/types";

/**
 * The library's data shapes, and the one piece of logic both sides need.
 *
 * Split out of `library.ts` because that module reads the filesystem: a client
 * component importing a *value* from it would pull `fs` into the browser
 * bundle and the page would 500. Types alone are erased at compile time and
 * would have been fine; `isOrphan` is not, so it lives here.
 */

/** One question, flattened out of its quiz and tagged with where it came from. */
export interface LibraryQuestion {
  /** Stable key: quiz id plus position, since questions have no id of their own. */
  key: string;
  quizId: string;
  quizTitle: string;
  /** Zero-based position within its quiz — the number the editor shows, minus one. */
  index: number;
  type: QuestionType;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  image?: string;
  audioUrl?: string;
  videoUrl?: string;
  bluffAnswer?: string;
  acceptedAnswers?: string[];
  correctYear?: number;
}

export interface LibraryQuestionsPayload {
  questions: LibraryQuestion[];
  quizzes: { id: string; title: string; count: number }[];
  totals: { quizzes: number; questions: number; byType: Record<string, number> };
}

export interface LibraryAsset {
  /** Path as the browser sees it, e.g. "/quiz-images/aurora.jpg". */
  url: string;
  folder: string;
  name: string;
  ext: string;
  bytes: number;
  kind: "image" | "audio" | "video" | "other";
  /** Questions that reference this file. Only meaningful in a `questions` folder. */
  usedBy: { quizId: string; quizTitle: string; index: number }[];
  /**
   * Source files that name this asset as a literal string, relative to the
   * repo root.
   *
   * Needed because "no question uses it" is not the same as "nothing uses it":
   * the lobby music is played from a hook, not named by any question, and
   * calling it an orphan would invite deleting a file the app depends on.
   *
   * Note for whoever edits this file: don't write an asset's literal path in a
   * comment here. The scan is a substring match over the source tree, so it
   * would count this very sentence as a reference.
   */
  codeRefs: string[];
}

/**
 * Where a folder's files get referenced from.
 *
 * `code` means the paths are *built* at runtime rather than written out — the
 * avatars are `/avatars/${file}` in `src/components/Avatar.tsx`, so no literal
 * scan will ever find them and their usage can't be judged from here at all.
 * A `questions` folder can be judged, because a literal scan plus the question
 * references between them cover every way its files get named.
 */
export type AssetUsage = "questions" | "code" | "manifest";

export interface LibraryFolder {
  name: string;
  count: number;
  bytes: number;
  usage: AssetUsage;
  /** Shown in the UI to explain what the folder is for. */
  note: string;
}

export interface LibraryAssetsPayload {
  assets: LibraryAsset[];
  folders: LibraryFolder[];
  /** References that point at a file which isn't on disk. Should always be empty. */
  broken: { quizId: string; quizTitle: string; index: number; url: string }[];
  /** References to somewhere else entirely, which the library can't vouch for. */
  external: { quizId: string; quizTitle: string; index: number; url: string }[];
  totals: { assets: number; bytes: number; unused: number };
}

/**
 * Whether nothing at all appears to use this file.
 *
 * Deliberately conservative: it says yes only when every avenue has been
 * checked and come back empty, and never for a folder whose paths are built at
 * runtime, since those can't be checked.
 */
export function isOrphan(asset: LibraryAsset, usage: AssetUsage | undefined): boolean {
  if (usage !== "questions") return false;
  return asset.usedBy.length === 0 && asset.codeRefs.length === 0;
}
