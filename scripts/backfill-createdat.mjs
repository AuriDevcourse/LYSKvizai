#!/usr/bin/env node
/**
 * Backfill createdAt ISO timestamp into every quiz JSON in data/quizzes/.
 *
 * Looks up the first git commit that added each file (following renames via
 * `git log --follow`) and writes that date as `createdAt`. Skips files that
 * already have `createdAt` set (editor saves already populate it).
 *
 * Run this after dropping new JSON files into data/quizzes/ directly.
 *
 *   node scripts/backfill-createdat.mjs          # default: write in place
 *   node scripts/backfill-createdat.mjs --dry    # preview only, no write
 *   node scripts/backfill-createdat.mjs --force  # overwrite existing createdAt
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry");
const FORCE = args.has("--force");

const DIR = join(process.cwd(), "data", "quizzes");
const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));

let updated = 0;
let skipped = 0;
let missingHistory = 0;

for (const file of files) {
  const full = join(DIR, file);
  const quiz = JSON.parse(readFileSync(full, "utf-8"));

  if (quiz.createdAt && !FORCE) {
    skipped++;
    continue;
  }

  let first;
  try {
    const out = execSync(
      `git log --follow --diff-filter=A --format=%aI -- "data/quizzes/${file}"`,
      { encoding: "utf-8" }
    ).trim();
    const dates = out.split("\n").filter(Boolean);
    first = dates[dates.length - 1];
  } catch {
    // git may fail if file is not tracked yet — fall through
  }

  if (!first) {
    console.log(`SKIP ${file} (no git history yet — commit the file first)`);
    missingHistory++;
    continue;
  }

  // Reorder keys so createdAt lives next to other metadata for readable diffs
  const ordered = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    emoji: quiz.emoji,
    createdAt: first,
    ...(quiz.updatedAt && { updatedAt: quiz.updatedAt }),
    questions: quiz.questions,
  };
  for (const key of Object.keys(quiz)) {
    if (!(key in ordered)) ordered[key] = quiz[key];
  }

  if (DRY_RUN) {
    console.log(`WOULD WRITE ${file} -> ${first}`);
  } else {
    writeFileSync(full, JSON.stringify(ordered, null, 2) + "\n", "utf-8");
    console.log(`UPDATED ${file} -> ${first}`);
  }
  updated++;
}

console.log(
  `\nDone. updated=${updated} skipped=${skipped} missingHistory=${missingHistory} total=${files.length}${DRY_RUN ? " (dry run — no files changed)" : ""}`
);
