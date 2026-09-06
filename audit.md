# Quizmo — Problem map

> **Status 2026-09-06 (later same day):** the 🔴 tier is fixed and verified —
> see the "Security, scoring and UI pass" entry in `progress.md`. Fixed here:
> S1-S8, C1-C4, I3, I5, I6, P1, P2, D3-D8. **Still open: I1** (live quiz edits
> reverted by deploy) and **I2** (rooms die on deploy) — both need a decision
> from you, not a patch. I4, D1 and D2 are untouched.
>
> The findings below are kept as written, so the reasoning stays readable.

Audit of `master` on 2026-09-06. Everything below was read in the source; the
"Verified" section at the bottom lists things I checked that turned out fine, so
nobody re-audits them.

Severity: 🔴 fix before the next public game · 🟡 fix soon · 🟢 debt

---

## 1. Unauthenticated write endpoints (🔴 — the whole cluster)

Quizmo is live at `quizmo.auridev.com` with **no auth on any content endpoint**.
Every item here is exploitable by a stranger with curl and no room code.

| # | Endpoint | What a stranger can do | Location |
|---|---|---|---|
| S1 | `DELETE /api/quizzes/[id]` | Delete any quiz. 54 curls wipes the library. | `src/app/api/quizzes/[id]/route.ts:44` |
| S2 | `PUT /api/quizzes/[id]` | Overwrite any quiz's questions with anything. | `src/app/api/quizzes/[id]/route.ts:20` |
| S3 | `POST /api/quizzes` | Create quizzes, or overwrite existing ones by reusing an id (`saveQuiz` is create-or-update). No rate limit — GET has one, POST doesn't. | `src/app/api/quizzes/route.ts:29` |
| S4 | `POST /api/upload` | Write files into the public web root. No auth, no rate limit. | `src/app/api/upload/route.ts:29` |

**S4 is the worst of the four** — two separate defects on top of "no auth":

- **Arbitrary file write.** The extension is taken from the user's filename with
  zero sanitization: `const ext = file.name.split(".").pop()`
  (`upload/route.ts:57`). The `slug` is sanitized; `ext` is not. A filename like
  `a.b/../../../../evil` yields `ext = "b/../../../../evil"`, and `path.join`
  happily resolves it out of `public/quiz-images/`.
- **Stored XSS on the app's own origin.** `file.type` is the client-declared MIME
  and is never cross-checked against the extension. Declare `image/png`, name the
  file `x.html` (or `x.svg`) → it's served from `/quiz-images/x.html` as HTML on
  `quizmo.auridev.com`. Player and host tokens live in `sessionStorage`
  (`play/[code]/page.tsx:36-66`), so that XSS reads them.

**Fix shape:** these are all host/editor operations, not player operations. Put
the editor + upload behind a single shared secret or a signed cookie, and gate
`/api/upload` on it. Then validate extension against an allowlist derived from
`file.type` rather than from `file.name`.

---

## 2. Multiplayer API hardening (🟡)

The session-token work from the 2026-04-20 session is solid where it was applied.
These are the gaps it didn't cover.

- **S5 — the rate limiter is trivially bypassed.** The bucket key is
  attacker-supplied: `actor = body.playerId || body.hostId || ip`
  (`api/rooms/route.ts:45`). Send a fresh random `playerId` per request and every
  request gets a virgin 120-req window. Worse, each unique key allocates a `Map`
  entry (`lib/rate-limit.ts:10`) that only gets reaped after 60s — so the bypass
  doubles as a memory-growth vector. Key on IP, or on `playerId` *only after*
  the token verifies.
- **S6 — `disconnect` is not token-gated.** `api/rooms/route.ts:155` calls
  `disconnectPlayer(code, playerId)` with no token; the comment acknowledges it.
  Anyone with a room code + a playerId can mark players gone, and in lobby state
  that removes them from the room entirely (`room-store.ts:84`).
- **S7 — no runtime validation of request bodies.** `req.json()` is cast straight
  to `ClientAction`. `answerIndex` is never bounds-checked, and results does
  `distribution[player.currentAnswer]++` (`room-store.ts:252`) on a 4-element
  array — `answerIndex: 999` turns it into a 1000-element sparse array that is
  then JSON-serialized to every client in the room. Same story for `year`.
- **S8 — the SSE stream is unauthenticated.** `playerId` comes from a query param
  and is never verified (`api/rooms/[code]/stream/route.ts:21`). Anyone with a
  room code gets the full event feed and can call `cancelPendingDisconnect` for
  another player's id. There's also no cap on connections per room or IP.

---

## 3. Scoring bugs (🔴 — these change who wins)

There are **two** scoring paths that both mutate `player.score`: one at answer
submission, one inside `getResultsPayload`. They disagree.

- **C1 — the Double power-up pays 3x, not 2x.**
  `submitAnswer` already applies the multiplier: `finalPoints = min(points*2, cap*2)`,
  `player.score += finalPoints` (`room-store.ts:836-844`). Then
  `getResultsPayload` adds *another* copy: `bonus = pr.points; player.score += bonus`
  (`room-store.ts:365-370`). Net **3× base**, while the UI reports 2×.
  Same bug on the year-guesser path (`room-store.ts:1017-1022`).
- **C2 — the points shown are not the points awarded.** The results loop
  *recomputes* `basePts` from `calculateScore` (`room-store.ts:305-318`), which
  ignores the double multiplier, the wager bonus, and the fastest-finger +150.
  So `playerResults[].points` under-reports while `totalScore` shows the truth —
  the player sees "+1000" and their total jump by 1150.
- **C3 — fastest-finger: shown correct, scored zero.** Submission grades with an
  exact match (`room-store.ts:915`), results grades the same answer with
  `fuzzyMatch` (`room-store.ts:263-268`). An answer that passes fuzzy but not
  exact is displayed as CORRECT and awarded nothing.
- **C4 — text and year answers corrupt the answer distribution.** Both set
  `player.currentAnswer = correct ? 0 : -1` as an "answered" flag
  (`room-store.ts:947`, `:1034`), so every correct text answer increments
  `distribution[0]`. Worth fixing *before* building the distribution bar chart
  that's sitting in the progress.md backlog — it would render garbage today.
- **C5 — `getResultsPayload` mutates scores, which makes it a landmine.**
  `showResults` guards it with `cachedResults` (`room-store.ts:1057`) and that
  guard currently holds, but the fallback at `room-store.ts:489`
  (`room.cachedResults ?? getResultsPayload(room)`) will silently re-award
  bonuses if it ever fires. The real fix is to make the function pure and apply
  score changes in one explicit place.

---

## 4. Deploy and data loss (🔴 I1, 🟡 rest)

- **I1 — quizzes edited on the live site are destroyed by the next deploy.**
  All 54 quiz files are tracked in git (`git ls-files data/quizzes` → 54), the
  live editor writes to that same `data/quizzes/` directory, and deploy does
  `git reset --hard` (per progress.md's note that `.env.local` "survives
  `git reset --hard`"). So: host edits a quiz on the live site → next push to
  master silently reverts it. Untracked *new* quizzes survive a reset but not a
  `git clean`. Either move quiz data out of the repo, or take the editor off prod.
- **I2 — every push kills live games.** In-memory room store + auto-deploy on
  push to master. Already logged in `ideas.md`; repeating because it's the same
  root cause as I1.
- **I3 — CI deploys without building.** `.github/workflows/` goes straight from
  `push` to `ssh … deploy`, with no `npm run build`, no lint, no typecheck —
  even though CLAUDE.md says the build "MUST pass before deploy". A broken build
  ships and the service restarts into it.
- **I5 (🔴) — `node_modules` did not match `package.json`.** `resend` and
  `@dicebear/*` are declared dependencies but were absent from the installed
  tree, so `Avatar` (used on every screen) and the feedback route could not
  resolve their imports. This was invisible because `tsc` was replaying a stale
  `tsconfig.tsbuildinfo` from April and never actually type-checking. Any deploy
  running `npm ci` would have built fine; the local tree was simply months
  behind. Fixed by `npm install`.
- **I6 (🔴) — 20 npm advisories, 10 of them high**, including a request-smuggling
  advisory against the pinned Next 16.1.6. `npm audit fix` plus a
  semver-minor bump to Next 16.3.4 takes it to a single low.
- **I4 — uploaded media has no backup.** `public/quiz-images/` holds 29 tracked
  files, but anything uploaded through the live editor lands there untracked and
  exists only on that one Hetzner box.

---

## 5. Performance (🟡)

- **P1 — the quiz list re-reads the disk on every request.** `listQuizzes`
  (`lib/quiz-store.ts:23`) reads and `JSON.parse`s all 54 files and runs three
  per-question filters over each, on every `GET /api/quizzes`. No cache. That's
  the home page. Cache the metadata in memory and invalidate on `saveQuiz`.
- **P2 — 210s cold dev start.** Measured this session: `✓ Ready in 210.3s` on a
  stale April `.next`. `rm -rf .next` before a session, or accept it.

---

## 6. Debt and papercuts (🟢)

- **D1 — the i18n layer is vestigial.** `lib/i18n/translations.ts` is 325 lines
  serving an English-only app, reached from 62 call sites. Deliberate per
  progress.md; still worth collapsing eventually.
- **D2 — `sanitizeText` strips `&` from quiz content** (`lib/sanitize.ts:7`),
  so "Rock & Roll" becomes "Rock  Roll". It's blocklist XSS defense in a React
  app where JSX already escapes — the stripping costs correctness and buys
  nothing here.
- **D3 — unvalidated `svg:` avatar path.** `Avatar.tsx:74` interpolates
  `parts[1]` into `src={`/avatars/${file}`}` with no sanitization. React escapes
  the attribute so it's not XSS, but `../` traversal within the origin works.
- **D4 — `MP_SERVER_URL` is unset locally** and there's no `.env.local` in the
  repo, so `next.config.ts:6` warns on every start and multiplayer rewrites
  silently no-op.
- **D5 — `lib/rate-limit.ts:13` starts a `setInterval` at module scope** without
  the `globalThis` guard that `room-store.ts:39` uses, so dev HMR leaks a timer
  per reload.
- **D6 (🟡) — elimination mode never tells anyone who was eliminated.** The full
  chain is wired *except* the last step: the server broadcasts `player-eliminated`
  (`room-store.ts:1092`), `useRoom` catches it and stores it (`useRoom.ts:187`),
  `play/[code]/page.tsx:123` destructures `eliminatedEvent` — and then nothing
  renders it. ESLint flags it as an unused variable. In elimination mode today,
  a player is silently removed from play with no announcement.
- **D7 — every room action swallows its error.** Ten `catch (e)` blocks in
  `play/[code]/page.tsx` (`:159`, `:168`, `:184`, `:200`, `:210`, `:219`, `:230`,
  `:244`, `:258`, `:284`) show a generic toast and discard `e` entirely. When a
  live game misbehaves there is nothing in the console to debug from. At minimum
  `console.error(e)` before the toast.
- **D8 — `ALL_POWER_UPS` is imported but unused** in `room-store.ts:17`, and
  `useSound.ts:19` reads `audioRefs.current` inside an effect cleanup (the
  classic stale-ref pattern).

---

## Verified clean — don't re-audit these

- `npx tsc --noEmit` → **exit 0**, no type errors. *(Corrected: the first run
  this session was a stale incremental-cache hit from an April `tsconfig.tsbuildinfo`
  and proved nothing. With the cache removed and dependencies installed it is
  genuinely clean — see I5 below for what the stale cache was hiding.)*
- **`dangerouslySetInnerHTML` in `Avatar.tsx:66` is safe.** `decode` accepts only
  integers and rejects `NaN` (`avatar-dicebear.ts:126`), and `renderSvg` clamps
  every index into a fixed enum array (`:211`). No user string reaches the SVG.
- **Path traversal via quiz id is blocked** — `sanitizeId` is applied inside
  `getQuiz`/`saveQuiz`/`deleteQuiz`, not at the caller (`lib/quiz-store.ts:14`).
- **The feedback route is properly built** — rate-limited 5/min/IP, and every
  interpolated value passes through `escapeHtml` (`api/feedback/route.ts:62-68`).
- **`showResults` is idempotent** via the `cachedResults` guard — the fix logged
  on 2026-04-20 holds. (See C5 for the remaining fallback path.)
- **The disconnect grace window already exists** — `DISCONNECT_GRACE_MS = 120s`
  at `room-store.ts:48`. (`ideas.md` claimed it was missing; corrected.)

- `npx eslint .` → **exit 0**: 0 errors, 45 warnings. Most are the
  `no-img-element` suggestion (18×) and `react-hooks/exhaustive-deps`. Two of the
  warnings are real findings, promoted to D6 and D7 above.
- `npm run build` → **exit 0**, 35s. The 210s figure in P2 was a cold Turbopack
  dev compile against a stale April `.next`, not a real build cost.

---

## Suggested order

1. Gate the four write endpoints (S1-S4) — this is the one that's exploitable
   right now by anyone who finds the domain.
2. Fix the double power-up 3x payout and the shown-vs-awarded mismatch (C1, C2).
3. Decide what happens to live quiz edits before the next deploy (I1).
4. Add a build gate to CI (I3) — cheap, and it protects everything else.
