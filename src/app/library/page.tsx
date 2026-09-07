"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, Library, Pencil, Image as ImageIcon, Music, Film,
  File as FileIcon, AlertTriangle, ExternalLink, EyeOff, Eye, Loader2, X,
} from "lucide-react";
import { isOrphan } from "@/lib/library-types";
import type { LibraryQuestionsPayload, LibraryAssetsPayload, LibraryAsset } from "@/lib/library-types";
import { EmptyPile } from "@/components/BrandArt";

/**
 * The library — one place to actually look at what the app contains.
 *
 * Before this, seeing a question meant opening one of 54 JSON files, and seeing
 * an asset meant listing `public/` by hand. `/editor` lists quizzes but never
 * their contents. So this is read-only browsing and searching, split in two:
 * questions, and the media on disk.
 *
 * Read-only is the whole design. Editing lives in `/editor` behind its secret;
 * nothing here writes, so nothing here needs that secret — which matters,
 * because `checkEditorAuth` fails closed in production and would otherwise make
 * the library unopenable on the live site.
 */

const PAGE = 40;

type Tab = "questions" | "assets";

const TYPE_LABELS: Record<string, string> = {
  standard: "Standard",
  bluff: "Bluff",
  audio: "Audio",
  video: "Video",
  "fastest-finger": "Fastest finger",
  "year-guesser": "Year guesser",
  "true-false": "True / false",
  "zoom-out": "Zoom out",
};

/** One accent per question type, so the list is scannable without reading. */
const TYPE_ACCENT: Record<string, string> = {
  standard: "#adaaaa",
  bluff: "#e77fff",
  audio: "#43a5fc",
  video: "#43a5fc",
  "fastest-finger": "#ff9062",
  "year-guesser": "#c9a825",
  "true-false": "#66bb6a",
  "zoom-out": "#ff716c",
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("questions");

  return (
    <div className="flex min-h-svh flex-col px-4 py-6 sm:px-6 sm:py-8">
      <header className="mx-auto w-full max-w-5xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back to home"
            className="tap-target -ml-2 rounded-full text-white/45 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Library className="h-5 w-5 text-primary" />
          <h1 className="font-headline text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Library
          </h1>
        </div>

        <div className="mt-5 flex gap-2" role="tablist" aria-label="Library sections">
          {(["questions", "assets"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`min-h-[44px] rounded-full px-5 text-sm font-bold capitalize transition-all ${
                tab === t
                  ? "bg-primary text-background"
                  : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {tab === "questions" ? <QuestionsTab /> : <AssetsTab />}
    </div>
  );
}

/* ------------------------------------------------------------------ shared */

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-5 py-14 text-center">
      {/*
       * The empty-state plate: a few chunky shapes set down in a pile. An
       * overlay with no ground of its own, so the page's atmosphere shows
       * through it. `xMidYMax meet` inside the file, because it is one
       * illustration rather than a texture. Inlined as a component so the fills
       * come from palette tokens and it costs no extra request.
       */}
      <EmptyPile className="pointer-events-none h-[110px] w-[180px] select-none" />
      <p className="font-headline text-base font-extrabold text-white/60">{children}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-white/50">
      <Loader2 className="h-4 w-4 animate-spin" /> Reading the library…
    </div>
  );
}

function Failed({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="py-16 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-error" />
      <p className="mt-3 text-white/70">{error}</p>
      <button onClick={onRetry} className="btn-secondary mt-4 min-h-[44px] !px-6 !py-0 !text-sm">
        Try again
      </button>
    </div>
  );
}

/**
 * Fetches a library endpoint once per mount.
 *
 * The load is kicked off from an effect rather than during render, and the
 * response is the only thing that sets state, so there is nothing for the
 * server and the client to disagree about.
 */
function useLibraryData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`The server answered ${r.status}.`);
        return r.json();
      })
      .then((json) => { if (!cancelled) setData(json as T); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the library.");
      });
    return () => { cancelled = true; };
  }, [url, attempt]);

  // Clearing the previous error belongs here rather than at the top of the
  // effect: the effect only re-runs because `retry` bumped `attempt`, so this is
  // the same moment without a redundant render pass.
  const retry = useCallback(() => {
    setError(null);
    setData(null);
    setAttempt((n) => n + 1);
  }, []);
  return { data, error, retry };
}

function SearchBox({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[44px] w-full appearance-none rounded-full border-[1.5px] border-white/8 bg-white/5 pl-10 pr-10 text-sm text-white placeholder:text-white/45 focus:border-primary/50 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/35 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- questions */

function QuestionsTab() {
  const { data, error, retry } = useLibraryData<LibraryQuestionsPayload>("/api/library/questions");
  const [query, setQuery] = useState("");
  const [quizId, setQuizId] = useState("all");
  const [type, setType] = useState("all");
  const [showAnswers, setShowAnswers] = useState(true);
  const [limit, setLimit] = useState(PAGE);

  /**
   * Narrowing the list restarts it from the top. Otherwise a search that
   * matches two questions would still be showing however many rows an earlier,
   * broader search had revealed.
   *
   * Done in the handlers rather than an effect: resetting state from an effect
   * costs a second render pass on every keystroke, and the compiler lint
   * rightly rejects it.
   */
  const narrow = useCallback(<T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setLimit(PAGE);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.questions.filter((item) => {
      if (quizId !== "all" && item.quizId !== quizId) return false;
      if (type !== "all" && item.type !== type) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.explanation.toLowerCase().includes(q) ||
        item.quizTitle.toLowerCase().includes(q) ||
        item.options.some((o) => o.toLowerCase().includes(q))
      );
    });
  }, [data, query, quizId, type]);

  if (error) return <Wrap><Failed error={error} onRetry={retry} /></Wrap>;
  if (!data) return <Wrap><Loading /></Wrap>;

  return (
    <Wrap>
      <div className="sticky top-0 z-10 -mx-1 bg-background/85 px-1 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchBox
            value={query}
            onChange={narrow(setQuery)}
            placeholder={`Search ${data.totals.questions} questions, answers and explanations…`}
          />
          <select
            value={quizId}
            onChange={(e) => narrow(setQuizId)(e.target.value)}
            aria-label="Filter by quiz"
            className="min-h-[44px] rounded-full border-[1.5px] border-white/8 bg-white/5 px-4 text-sm font-bold text-white focus:border-primary/50 focus:outline-none"
          >
            <option value="all">All {data.totals.quizzes} quizzes</option>
            {data.quizzes.map((q) => (
              <option key={q.id} value={q.id}>{q.title} ({q.count})</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAnswers((s) => !s)}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white/5 px-4 text-sm font-bold text-white/55 transition-colors hover:bg-white/10 hover:text-white sm:justify-start"
            title={showAnswers ? "Hide the correct answers" : "Show the correct answers"}
          >
            {showAnswers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Answers
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <TypeChip label="All types" count={data.totals.questions} active={type === "all"} onClick={() => narrow(setType)("all")} />
          {Object.entries(data.totals.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([t, n]) => (
              <TypeChip
                key={t}
                label={TYPE_LABELS[t] ?? t}
                count={n}
                accent={TYPE_ACCENT[t]}
                active={type === t}
                onClick={() => narrow(setType)(t)}
              />
            ))}
        </div>
      </div>

      <p className="pb-3 pt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/35">
        {filtered.length === data.totals.questions
          ? `${filtered.length} questions`
          : `${filtered.length} of ${data.totals.questions}`}
      </p>

      {filtered.length === 0 ? (
        <Empty>Nothing matches that.</Empty>
      ) : (
        <>
          <ul className="space-y-2.5">
            {filtered.slice(0, limit).map((item) => (
              <QuestionRow key={item.key} item={item} showAnswer={showAnswers} />
            ))}
          </ul>
          {limit < filtered.length && (
            <button
              onClick={() => setLimit((n) => n + PAGE * 2)}
              className="btn-secondary mx-auto mt-5 flex min-h-[48px] items-center !px-7 !py-0 !text-sm"
            >
              Show {Math.min(PAGE * 2, filtered.length - limit)} more
            </button>
          )}
        </>
      )}
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  // `pb-28` clears the fixed BottomNav and its gradient, which are `sm:hidden`
  // — without it the last card sits underneath them on a phone.
  return <main className="mx-auto w-full max-w-5xl flex-1 pb-28 sm:pb-12">{children}</main>;
}

function TypeChip({
  label, count, accent = "#adaaaa", active, onClick,
}: { label: string; count: number; accent?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active ? { backgroundColor: accent, color: "#0e0e0e" } : undefined}
      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
        active ? "" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
      }`}
    >
      {label} <span className={active ? "opacity-60" : "opacity-45"}>{count}</span>
    </button>
  );
}

function QuestionRow({
  item, showAnswer,
}: { item: LibraryQuestionsPayload["questions"][number]; showAnswer: boolean }) {
  const accent = TYPE_ACCENT[item.type] ?? "#adaaaa";
  /** Some types carry four empty strings rather than real choices. */
  const hasOptions = item.options.some((o) => o.trim().length > 0);

  return (
    <li className="surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]">
        <span className="text-white/50">{item.quizTitle}</span>
        <span className="text-white/20">#{item.index + 1}</span>
        {item.type !== "standard" && (
          <span
            className="rounded-full px-2 py-0.5 tracking-[0.1em]"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            {TYPE_LABELS[item.type] ?? item.type}
          </span>
        )}
        <Link
          href={`/editor/${item.quizId}`}
          className="ml-auto flex items-center gap-1 text-white/25 transition-colors hover:text-primary"
          aria-label={`Edit ${item.quizTitle} in the editor`}
        >
          <Pencil className="h-3 w-3" /> Edit
        </Link>
      </div>

      <p className="mt-2 font-bold leading-snug text-white">{item.question}</p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        {item.image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className="h-24 w-full shrink-0 rounded-xl object-cover sm:w-36"
          />
        )}

        <div className="min-w-0 flex-1">
          {hasOptions ? (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {item.options.map((opt, i) => {
                const isCorrect = i === item.correct;
                const highlight = showAnswer && isCorrect;
                return (
                  <li
                    key={i}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      highlight
                        ? "bg-answer-green/18 font-bold text-answer-green-lit"
                        : "bg-white/[0.04] text-white/55"
                    }`}
                  >
                    {opt}
                    {highlight && <span className="ml-1.5 text-answer-green">✓</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            /* Year-guesser and fastest-finger questions aren't multiple choice:
               the data still carries `options: ["","","",""]` as filler and
               `correct: 0` as a meaningless default. Rendering that grid drew
               four blank pills with a tick on the first, which reads as "the
               answer is blank". So the real answer is shown instead. */
            <p className="rounded-lg bg-answer-green/15 px-3 py-2 text-sm font-bold text-answer-green-lit">
              {!showAnswer
                ? "Answer hidden"
                : item.correctYear !== undefined
                  ? item.correctYear
                  : item.acceptedAnswers?.length
                    ? item.acceptedAnswers.join(" · ")
                    : "No answer recorded"}
            </p>
          )}

          {/* Whatever else this question type carries. Shown only when present,
              so a standard question stays as short as it reads. */}
          {((hasOptions && (item.correctYear !== undefined || item.acceptedAnswers)) || item.bluffAnswer || item.audioUrl || item.videoUrl) && (
            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
              {/* Only when the grid above is doing the answering; otherwise the
                  branch that replaced it has already shown these. */}
              {hasOptions && item.correctYear !== undefined && (
                <div>
                  <dt className="inline font-bold uppercase tracking-wider">Year </dt>
                  <dd className="inline text-white/65">{showAnswer ? item.correctYear : "—"}</dd>
                </div>
              )}
              {item.bluffAnswer && (
                <div>
                  <dt className="inline font-bold uppercase tracking-wider">Bluff </dt>
                  <dd className="inline text-white/65">{item.bluffAnswer}</dd>
                </div>
              )}
              {hasOptions && item.acceptedAnswers && (
                <div>
                  <dt className="inline font-bold uppercase tracking-wider">Accepts </dt>
                  <dd className="inline text-white/65">{showAnswer ? item.acceptedAnswers.join(", ") : "—"}</dd>
                </div>
              )}
              {item.audioUrl && (
                <div>
                  <dt className="inline font-bold uppercase tracking-wider">Audio </dt>
                  <dd className="inline text-white/65">{item.audioUrl}</dd>
                </div>
              )}
              {item.videoUrl && (
                <div>
                  <dt className="inline font-bold uppercase tracking-wider">Video </dt>
                  <dd className="inline text-white/65">{item.videoUrl}</dd>
                </div>
              )}
            </dl>
          )}

          {item.explanation && (
            <p className="mt-2 text-xs leading-relaxed text-white/50">{item.explanation}</p>
          )}
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ assets */

function AssetsTab() {
  const { data, error, retry } = useLibraryData<LibraryAssetsPayload>("/api/library/assets");
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  /** Same reasoning as the questions tab. */
  const narrow = useCallback(<T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setLimit(PAGE);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.assets.filter((a) => {
      if (folder !== "all" && a.folder !== folder) return false;
      if (unusedOnly && !isOrphan(a, usageOf(data, a.folder))) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.usedBy.some((u) => u.quizTitle.toLowerCase().includes(q));
    });
  }, [data, query, folder, unusedOnly]);

  if (error) return <Wrap><Failed error={error} onRetry={retry} /></Wrap>;
  if (!data) return <Wrap><Loading /></Wrap>;

  return (
    <Wrap>
      {/* Folder cards double as the filter and as the explanation of what each
          folder is for — including which ones can meaningfully be "unused". */}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {data.folders.map((f) => (
          <button
            key={f.name}
            onClick={() => narrow(setFolder)(folder === f.name ? "all" : f.name)}
            style={{ ["--bloom" as string]: "rgba(255,144,98,0.35)" }}
            className={`surface surface-hover p-4 text-left ${
              folder === f.name ? "ring-[1.5px] ring-primary/60" : ""
            }`}
          >
            <p className="font-headline text-xl font-extrabold text-white">{f.count}</p>
            <p className="mt-0.5 truncate text-xs font-bold text-white/70">{f.name}</p>
            <p className="mt-1.5 text-[11px] leading-snug text-white/35">{f.note}</p>
            <p className="mt-1.5 text-[11px] text-white/25">{formatBytes(f.bytes)}</p>
          </button>
        ))}
      </div>

      {data.broken.length > 0 && (
        <div className="mt-4 rounded-2xl border-[1.5px] border-error/30 bg-error/10 p-4">
          <p className="flex items-center gap-2 font-bold text-error">
            <AlertTriangle className="h-4 w-4" />
            {data.broken.length} question{data.broken.length === 1 ? "" : "s"} point at a file that isn&apos;t on disk
          </p>
          <ul className="mt-2 space-y-0.5 text-xs text-white/60">
            {data.broken.slice(0, 10).map((b, i) => (
              <li key={i}>
                {b.quizTitle} #{b.index + 1} → <code className="text-error">{b.url}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sticky top-0 z-10 -mx-1 mt-4 bg-background/85 px-1 pb-3 pt-3 backdrop-blur-xl">
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchBox value={query} onChange={narrow(setQuery)} placeholder={`Search ${data.totals.assets} files…`} />
          <button
            type="button"
            onClick={() => narrow(setUnusedOnly)(!unusedOnly)}
            className={`min-h-[44px] rounded-full px-4 text-sm font-bold transition-colors ${
              unusedOnly ? "bg-answer-yellow text-background" : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
            }`}
          >
            Unused only <span className="opacity-60">{data.totals.unused}</span>
          </button>
          {folder !== "all" && (
            <button
              type="button"
              onClick={() => narrow(setFolder)("all")}
              className="min-h-[44px] rounded-full bg-white/5 px-4 text-sm font-bold text-white/55 hover:bg-white/10 hover:text-white"
            >
              Clear folder
            </button>
          )}
        </div>
      </div>

      <p className="pb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/35">
        {filtered.length === data.totals.assets
          ? `${filtered.length} files · ${formatBytes(data.totals.bytes)}`
          : `${filtered.length} of ${data.totals.assets}`}
      </p>

      {filtered.length === 0 ? (
        <Empty>No files match that.</Empty>
      ) : (
        <>
          <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, limit).map((a) => (
              <AssetCard key={a.url} asset={a} usage={usageOf(data, a.folder)} />
            ))}
          </ul>
          {limit < filtered.length && (
            <button
              onClick={() => setLimit((n) => n + PAGE * 2)}
              className="btn-secondary mx-auto mt-5 flex min-h-[48px] items-center !px-7 !py-0 !text-sm"
            >
              Show {Math.min(PAGE * 2, filtered.length - limit)} more
            </button>
          )}
        </>
      )}

      {data.external.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/35">
            <ExternalLink className="h-3.5 w-3.5" />
            {data.external.length} references point somewhere else
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-white/45">
            These load from another domain, so they aren&apos;t in the library and can
            break without anything here changing.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-white/45">
            {data.external.slice(0, 12).map((e, i) => (
              <li key={i} className="truncate">
                <span className="text-white/60">{e.quizTitle} #{e.index + 1}</span> → {e.url}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Wrap>
  );
}

function usageOf(data: LibraryAssetsPayload, folder: string) {
  return data.folders.find((f) => f.name === folder)?.usage ?? "questions";
}

function AssetCard({ asset, usage }: { asset: LibraryAsset; usage: LibraryAssetsPayload["folders"][number]["usage"] }) {
  const Icon = asset.kind === "audio" ? Music : asset.kind === "video" ? Film : asset.kind === "image" ? ImageIcon : FileIcon;
  const orphan = isOrphan(asset, usage);

  return (
    <li className="surface overflow-hidden">
      {asset.kind === "image" ? (
        <div className="flex h-32 items-center justify-center bg-white/[0.03] p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.url} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
        </div>
      ) : asset.kind === "audio" ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 bg-white/[0.03] p-3">
          <Music className="h-6 w-6 text-secondary" />
          <audio controls preload="none" src={asset.url} className="w-full max-w-full" />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center bg-white/[0.03]">
          <Icon className="h-7 w-7 text-white/25" />
        </div>
      )}

      <div className="p-3">
        <p className="truncate text-sm font-bold text-white" title={asset.name}>{asset.name}</p>
        <p className="mt-0.5 text-[11px] text-white/35">
          {asset.folder} · {formatBytes(asset.bytes)}
        </p>

        {asset.usedBy.length > 0 ? (
          <p className="mt-1.5 text-[11px] leading-snug text-white/45">
            Used by{" "}
            {asset.usedBy.slice(0, 3).map((u, i) => (
              <span key={i}>
                {i > 0 && ", "}
                <Link href={`/editor/${u.quizId}`} className="text-primary/80 hover:text-primary">
                  {u.quizTitle} #{u.index + 1}
                </Link>
              </span>
            ))}
            {asset.usedBy.length > 3 && ` +${asset.usedBy.length - 3}`}
          </p>
        ) : asset.codeRefs.length > 0 ? (
          <p className="mt-1.5 truncate text-[11px] text-white/50" title={asset.codeRefs.join("\n")}>
            Used by <span className="text-white/60">{asset.codeRefs[0]}</span>
            {asset.codeRefs.length > 1 && ` +${asset.codeRefs.length - 1}`}
          </p>
        ) : orphan ? (
          <p className="mt-1.5 text-[11px] font-bold text-answer-yellow">Nothing references this</p>
        ) : (
          <p className="mt-1.5 text-[11px] text-white/25">
            {usage === "code" ? "Built at runtime — can't be checked" : "Listed in a manifest"}
          </p>
        )}
      </div>
    </li>
  );
}
