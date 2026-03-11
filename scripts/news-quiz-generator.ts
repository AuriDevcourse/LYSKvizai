#!/usr/bin/env npx tsx
/**
 * News Quiz Generator
 *
 * Fetches RSS feeds from major English news portals, groups articles by topic,
 * uses Claude API to generate 10-question quizzes, and writes them to data/quizzes/.
 * Old news quizzes are cleaned up automatically (default: 3 days).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/news-quiz-generator.ts
 *
 * Cron (daily at 6am UTC):
 *   0 6 * * * cd /path/to/LYSKvizai && ANTHROPIC_API_KEY=sk-... npx tsx scripts/news-quiz-generator.ts >> /var/log/news-quiz.log 2>&1
 */

import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const QUIZZES_DIR = path.join(process.cwd(), "data", "quizzes");
const MAX_AGE_DAYS = 3; // Remove news quizzes older than this
const QUESTIONS_PER_QUIZ = 10;
const NEWS_QUIZ_PREFIX = "news-"; // All generated quizzes start with this

interface FeedSource {
  url: string;
  topic: string;
}

// RSS feeds grouped by topic
const FEEDS: FeedSource[] = [
  // World / Politics
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", topic: "world" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", topic: "world" },
  { url: "https://feeds.reuters.com/Reuters/worldNews", topic: "world" },

  // Technology
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", topic: "tech" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", topic: "tech" },
  { url: "https://www.theverge.com/rss/index.xml", topic: "tech" },

  // Science
  { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", topic: "science" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml", topic: "science" },

  // Business / Economy
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", topic: "business" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", topic: "business" },

  // Sports
  { url: "https://feeds.bbci.co.uk/sport/rss.xml", topic: "sports" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml", topic: "sports" },

  // Entertainment
  { url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", topic: "entertainment" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml", topic: "entertainment" },

  // Health
  { url: "https://feeds.bbci.co.uk/news/health/rss.xml", topic: "health" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml", topic: "health" },
];

const TOPIC_META: Record<string, { emoji: string; title: string }> = {
  world: { emoji: "🌍", title: "Today's World News" },
  tech: { emoji: "💻", title: "Today's Tech News" },
  science: { emoji: "🔬", title: "Today's Science News" },
  business: { emoji: "📈", title: "Today's Business News" },
  sports: { emoji: "⚽", title: "Today's Sports News" },
  entertainment: { emoji: "🎬", title: "Today's Entertainment News" },
  health: { emoji: "🏥", title: "Today's Health News" },
};

// ---------------------------------------------------------------------------
// RSS Parsing (lightweight, no external dependency)
// ---------------------------------------------------------------------------

interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

function parseRSS(xml: string): Article[] {
  const articles: Article[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTag(item, "title");
    const description = extractTag(item, "description");
    const link = extractTag(item, "link");
    const pubDate = extractTag(item, "pubDate");

    if (title) {
      articles.push({
        title: stripCDATA(title),
        description: stripCDATA(description || ""),
        link: link || "",
        pubDate: pubDate || "",
      });
    }
  }

  return articles;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}

function stripCDATA(text: string): string {
  return text
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, "") // strip HTML tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

// ---------------------------------------------------------------------------
// Fetch feeds
// ---------------------------------------------------------------------------

async function fetchFeed(source: FeedSource): Promise<Article[]> {
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "QuizmoNewsBot/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.warn(`  ⚠ ${source.url} returned ${res.status}`);
      return [];
    }
    const xml = await res.text();
    return parseRSS(xml);
  } catch (e) {
    console.warn(`  ⚠ Failed to fetch ${source.url}:`, (e as Error).message);
    return [];
  }
}

async function fetchAllArticlesByTopic(): Promise<Record<string, Article[]>> {
  const byTopic: Record<string, Article[]> = {};

  console.log("Fetching RSS feeds...");
  const results = await Promise.allSettled(
    FEEDS.map(async (source) => {
      const articles = await fetchFeed(source);
      return { topic: source.topic, articles };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { topic, articles } = result.value;
      if (!byTopic[topic]) byTopic[topic] = [];
      byTopic[topic].push(...articles);
    }
  }

  // Filter to today's articles only (last 24h)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const topic of Object.keys(byTopic)) {
    byTopic[topic] = byTopic[topic].filter((a) => {
      if (!a.pubDate) return true; // include if no date
      const date = new Date(a.pubDate).getTime();
      return !isNaN(date) ? date > oneDayAgo : true;
    });

    // Deduplicate by title similarity
    const seen = new Set<string>();
    byTopic[topic] = byTopic[topic].filter((a) => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`  ${topic}: ${byTopic[topic].length} articles`);
  }

  return byTopic;
}

// ---------------------------------------------------------------------------
// Claude API — generate quiz questions
// ---------------------------------------------------------------------------

async function generateQuiz(
  topic: string,
  articles: Article[]
): Promise<{ question: string; options: [string, string, string, string]; correct: number; explanation: string }[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY");
    process.exit(1);
  }

  // Take top 15 articles for context
  const topArticles = articles.slice(0, 15);
  const articlesText = topArticles
    .map((a, i) => `${i + 1}. ${a.title}\n   ${a.description}`)
    .join("\n\n");

  const prompt = `You are a quiz generator for a Kahoot-style quiz app. Based on the following news articles from today, create exactly ${QUESTIONS_PER_QUIZ} multiple-choice quiz questions.

ARTICLES:
${articlesText}

RULES:
- Each question must have exactly 4 options
- Questions should be educational and interesting
- Questions should test knowledge about the news events
- Mix of factual questions (who, what, where, when) and analytical ones
- Make wrong options plausible but clearly incorrect
- Include a brief explanation for each correct answer
- Questions should make sense even without reading the original articles
- Do NOT use decorative quotes like \u201e or \u201c — use plain text only

Return ONLY valid JSON array, no markdown, no code fences:
[
  {
    "question": "What happened...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation of the correct answer."
  }
]`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  Claude API error (${res.status}):`, err);
      return null;
    }

    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (!text) {
      console.error("  Empty Claude response");
      return null;
    }

    // Parse JSON from response (handle potential markdown fences)
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const questions = JSON.parse(jsonStr);

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error("  Invalid quiz format from Claude");
      return null;
    }

    return questions.slice(0, QUESTIONS_PER_QUIZ);
  } catch (e) {
    console.error("  Quiz generation failed:", (e as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Write quiz files & cleanup
// ---------------------------------------------------------------------------

function getDateString(): string {
  return new Date().toISOString().split("T")[0]; // "2026-03-11"
}

async function writeQuiz(topic: string, questions: Array<{ question: string; options: [string, string, string, string]; correct: number; explanation: string }>) {
  const date = getDateString();
  const id = `${NEWS_QUIZ_PREFIX}${topic}-${date}`;
  const meta = TOPIC_META[topic] || { emoji: "📰", title: `Today's ${topic} News` };

  const quiz = {
    id,
    title: meta.title,
    description: `News quiz for ${date}`,
    emoji: meta.emoji,
    language: "en",
    questions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await fs.mkdir(QUIZZES_DIR, { recursive: true });
  const filePath = path.join(QUIZZES_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(quiz, null, 2), "utf-8");
  console.log(`  ✓ Written ${filePath} (${questions.length} questions)`);
}

async function cleanupOldQuizzes() {
  console.log("\nCleaning up old news quizzes...");
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  try {
    const files = await fs.readdir(QUIZZES_DIR);
    for (const file of files) {
      if (!file.startsWith(NEWS_QUIZ_PREFIX) || !file.endsWith(".json")) continue;

      const filePath = path.join(QUIZZES_DIR, file);
      try {
        const raw = await fs.readFile(filePath, "utf-8");
        const quiz = JSON.parse(raw);
        const created = new Date(quiz.createdAt).getTime();
        if (!isNaN(created) && created < cutoff) {
          await fs.unlink(filePath);
          console.log(`  🗑 Removed ${file} (expired)`);
        }
      } catch {
        // skip invalid files
      }
    }
  } catch {
    // directory might not exist yet
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n=== News Quiz Generator — ${new Date().toISOString()} ===\n`);

  // 1. Cleanup old quizzes
  await cleanupOldQuizzes();

  // 2. Fetch articles
  const byTopic = await fetchAllArticlesByTopic();

  // 3. Generate quizzes for each topic
  const topics = Object.keys(TOPIC_META);
  let generated = 0;

  for (const topic of topics) {
    const articles = byTopic[topic];
    if (!articles || articles.length < 3) {
      console.log(`\nSkipping ${topic}: not enough articles (${articles?.length ?? 0})`);
      continue;
    }

    console.log(`\nGenerating ${topic} quiz from ${articles.length} articles...`);
    const questions = await generateQuiz(topic, articles);

    if (questions && questions.length >= 5) {
      await writeQuiz(topic, questions);
      generated++;
    } else {
      console.log(`  ✗ Failed to generate ${topic} quiz`);
    }

    // Small delay between API calls
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n=== Done! Generated ${generated}/${topics.length} quizzes ===\n`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
