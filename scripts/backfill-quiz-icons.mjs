#!/usr/bin/env node
/**
 * Backfill the `icon` field into every quiz JSON using a curated mapping.
 * Writes Lucide icon NAMES (strings) that match the palette in
 * src/lib/quiz-icons.ts. Run once after dropping new quizzes into
 * data/quizzes/ to give them a default icon.
 *
 *   node scripts/backfill-quiz-icons.mjs          # write in place
 *   node scripts/backfill-quiz-icons.mjs --dry    # preview
 *   node scripts/backfill-quiz-icons.mjs --force  # overwrite existing icon
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry");
const FORCE = args.has("--force");

const DIR = join(process.cwd(), "data", "quizzes");

// Explicit mappings for built-in quizzes. Anything not listed here falls
// through to the heuristic below.
const EXPLICIT = {
  "animals": "PawPrint",
  "animation": "Film",
  "basketball": "Trophy",
  "biology": "Dna",
  "bluff-animals": "PawPrint",
  "bluff-food": "UtensilsCrossed",
  "bluff-geography": "Globe",
  "bluff-history": "Landmark",
  "bluff-science": "FlaskConical",
  "drinks": "Wine",
  "european-geography": "Globe",
  "games-modern": "Gamepad2",
  "games-retro": "Joystick",
  "general-knowledge": "Brain",
  "geography": "Globe",
  "logic-puzzles": "Puzzle",
  "mathematics": "Calculator",
  "mixed-quiz": "Dices",
  "movies-and-series": "Clapperboard",
  "music-classical": "Music",
  "music-hiphop": "Headphones",
  "music-pop": "Mic",
  "music-rock": "Guitar",
  "nature": "Trees",
  "oceans-and-continents": "Waves",
  "olympic-games": "Medal",
  "physics": "Atom",
  "science": "FlaskConical",
  "social-networks": "Smartphone",
  "space": "Rocket",
  "technology": "Cpu",
  "technology-ai": "Bot",
  "technology-internet": "Wifi",
  "tv-series": "Tv",
  "video-games": "Gamepad2",
  "world-capitals": "MapPin",
  "world-celebrities": "Star",
  "world-cuisine": "UtensilsCrossed",
  "world-football": "Trophy",
  "world-history": "Landmark",
  "year-entertainment": "Film",
  "year-science-tech": "Atom",
  "year-space": "Rocket",
  "year-sports": "Trophy",
  "year-world-history": "Scroll",
  "zoom-out-pictures": "ZoomIn",
};

function guessIcon(quiz) {
  if (EXPLICIT[quiz.id]) return EXPLICIT[quiz.id];
  if (quiz.id.startsWith("news-")) return "Newspaper";
  if (quiz.id.startsWith("year-")) return "Calendar";
  if (quiz.id.startsWith("bluff-")) return "HelpCircle";
  return "BookOpen";
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
let updated = 0;
let skipped = 0;

for (const file of files) {
  const full = join(DIR, file);
  const quiz = JSON.parse(readFileSync(full, "utf-8"));

  if (quiz.icon && !FORCE) {
    skipped++;
    continue;
  }

  const icon = guessIcon(quiz);

  // Key order: id, title, description, emoji, icon, createdAt, updatedAt, questions, ...
  const ordered = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    emoji: quiz.emoji,
    icon,
    ...(quiz.createdAt && { createdAt: quiz.createdAt }),
    ...(quiz.updatedAt && { updatedAt: quiz.updatedAt }),
    questions: quiz.questions,
  };
  for (const key of Object.keys(quiz)) {
    if (!(key in ordered)) ordered[key] = quiz[key];
  }

  if (DRY_RUN) {
    console.log(`WOULD SET ${file} -> ${icon}`);
  } else {
    writeFileSync(full, JSON.stringify(ordered, null, 2) + "\n", "utf-8");
    console.log(`SET ${file} -> ${icon}`);
  }
  updated++;
}

console.log(`\nDone. updated=${updated} skipped=${skipped} total=${files.length}${DRY_RUN ? " (dry run)" : ""}`);
