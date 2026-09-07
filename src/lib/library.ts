import { promises as fs } from "fs";
import path from "path";
import { listQuizzes, getQuiz } from "./quiz-store";
import type { Question, QuestionType } from "@/data/types";
import { isOrphan } from "./library-types";
import type {
  LibraryQuestion, LibraryQuestionsPayload, LibraryAsset,
  LibraryAssetsPayload, AssetUsage,
} from "./library-types";

export * from "./library-types";

/**
 * The library: one read-only view over everything the app authors — every
 * question in every quiz, and every asset on disk — so it can be browsed and
 * searched instead of opened file by file.
 *
 * Read-only on purpose. Editing already has a home in `/editor`, and keeping
 * this side free of writes means it needs no editor secret, which matters
 * because `checkEditorAuth` fails closed in production.
 */

/**
 * An untyped question is a "standard" one. The field is optional in the data
 * and absent in most of the older quizzes, so it's normalised here rather than
 * leaving every consumer to repeat the fallback.
 */
function typeOf(q: Question): QuestionType {
  return q.type ?? "standard";
}

export async function collectQuestions(): Promise<LibraryQuestionsPayload> {
  const metas = await listQuizzes();
  const questions: LibraryQuestion[] = [];
  const quizzes: { id: string; title: string; count: number }[] = [];
  const byType: Record<string, number> = {};

  for (const meta of metas) {
    const quiz = await getQuiz(meta.id);
    if (!quiz) continue;
    quizzes.push({ id: quiz.id, title: quiz.title, count: quiz.questions.length });

    quiz.questions.forEach((q, index) => {
      const type = typeOf(q);
      byType[type] = (byType[type] ?? 0) + 1;
      questions.push({
        key: `${quiz.id}#${index}`,
        quizId: quiz.id,
        quizTitle: quiz.title,
        index,
        type,
        question: q.question,
        options: q.options ?? [],
        correct: q.correct,
        explanation: q.explanation,
        image: q.image,
        audioUrl: q.audioUrl,
        videoUrl: q.videoUrl,
        bluffAnswer: q.bluffAnswer,
        acceptedAnswers: q.acceptedAnswers,
        correctYear: q.correctYear,
      });
    });
  }

  quizzes.sort((a, b) => a.title.localeCompare(b.title));

  return {
    questions,
    quizzes,
    totals: { quizzes: quizzes.length, questions: questions.length, byType },
  };
}

/* ------------------------------------------------------------------ assets */

/**
 * The folders under `public/` the library will list.
 *
 * A fixed allowlist, not a parameter. Listing a directory chosen by the caller
 * is a traversal hole and an information leak even when the path is sanitised;
 * there is no user input here at all, so there is nothing to escape.
 *
 * `icons` and the loose files at the root of `public/` are deliberately left
 * out: favicons and Next's own SVGs aren't content anyone authors.
 */
const ASSET_FOLDERS: { name: string; usage: AssetUsage; note: string }[] = [
  { name: "quiz-images", usage: "questions", note: "Pictures shown with a question." },
  { name: "sounds", usage: "questions", note: "Audio cues and audio-round clips." },
  { name: "avatars", usage: "code", note: "Player avatars — chosen at join time, resolved in Avatar.tsx." },
  { name: "tint-local", usage: "manifest", note: "Your own Tint references. Gitignored, never deployed." },
];

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"]);
const AUDIO_EXT = new Set([".mp3", ".wav", ".ogg", ".m4a"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov"]);

function kindOf(ext: string): LibraryAsset["kind"] {
  if (IMAGE_EXT.has(ext)) return "image";
  if (AUDIO_EXT.has(ext)) return "audio";
  if (VIDEO_EXT.has(ext)) return "video";
  return "other";
}

/**
 * Every source file's text, concatenated once, so each asset can be checked
 * against it with a substring test instead of re-reading the tree 121 times.
 */
async function readSourceText(): Promise<{ file: string; text: string }[]> {
  const root = path.join(process.cwd(), "src");
  const out: { file: string; text: string }[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
        try {
          out.push({ file: path.relative(process.cwd(), full), text: await fs.readFile(full, "utf-8") });
        } catch {
          // Unreadable file: skip it rather than failing the whole listing.
        }
      }
    }
  }

  await walk(root);
  return out;
}

export async function collectAssets(): Promise<LibraryAssetsPayload> {
  const { questions } = await collectQuestions();
  const sources = await readSourceText();

  // Every reference a question makes, indexed by the url it points at, so each
  // file can be told who uses it — and so unused files stand out.
  const references = new Map<string, { quizId: string; quizTitle: string; index: number }[]>();
  const external: LibraryAssetsPayload["external"] = [];

  for (const q of questions) {
    for (const url of [q.image, q.audioUrl, q.videoUrl]) {
      if (!url) continue;
      const where = { quizId: q.quizId, quizTitle: q.quizTitle, index: q.index };
      if (!url.startsWith("/")) {
        external.push({ ...where, url });
        continue;
      }
      const list = references.get(url) ?? [];
      list.push(where);
      references.set(url, list);
    }
  }

  const publicDir = path.join(process.cwd(), "public");
  const assets: LibraryAsset[] = [];
  const folders: LibraryAssetsPayload["folders"] = [];

  for (const { name: folder, usage, note } of ASSET_FOLDERS) {
    let names: string[];
    try {
      names = await fs.readdir(path.join(publicDir, folder));
    } catch {
      // A folder that isn't there is normal — `tint-local` is gitignored and
      // most checkouts won't have it.
      continue;
    }

    let count = 0;
    let bytes = 0;
    for (const name of names) {
      if (name.startsWith(".")) continue;
      const full = path.join(publicDir, folder, name);
      let size = 0;
      try {
        const stat = await fs.stat(full);
        if (!stat.isFile()) continue;
        size = stat.size;
      } catch {
        continue;
      }
      const ext = path.extname(name).toLowerCase();
      const url = `/${folder}/${name}`;
      assets.push({
        url,
        folder,
        name,
        ext,
        bytes: size,
        kind: kindOf(ext),
        usedBy: references.get(url) ?? [],
        codeRefs: sources.filter((s) => s.text.includes(url)).map((s) => s.file),
      });
      count += 1;
      bytes += size;
    }
    folders.push({ name: folder, count, bytes, usage, note });
  }

  // Anything a question points at that no file backs. Zero is the healthy
  // answer; a non-zero count means a question renders a broken image.
  const onDisk = new Set(assets.map((a) => a.url));
  const broken: LibraryAssetsPayload["broken"] = [];
  for (const [url, users] of references) {
    if (onDisk.has(url)) continue;
    for (const u of users) broken.push({ ...u, url });
  }

  assets.sort((a, b) => a.folder.localeCompare(b.folder) || a.name.localeCompare(b.name));

  return {
    assets,
    folders,
    broken,
    external,
    totals: {
      assets: assets.length,
      bytes: assets.reduce((n, a) => n + a.bytes, 0),
      // Unused means: no question names it, no source file names it, and the
      // folder isn't one whose paths are assembled at runtime. All three, or
      // the count turns into a list of files it would be a bug to delete.
      unused: assets.filter((a) => isOrphan(a, ASSET_FOLDERS.find((f) => f.name === a.folder)?.usage)).length,
    },
  };
}
