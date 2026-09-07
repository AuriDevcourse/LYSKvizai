# Quizmo — 100 improvements

Ten areas (see `AREAS.md`), ten improvements each, found by a parallel analysis
pass over the codebase on 2026-09-06.

Status: `[ ]` open · `[x]` done · `[~]` partial · `[-]` rejected, with a reason

Each item carries the `file:line` it was found at. Line numbers drift as the work
lands — treat them as a starting point, not gospel.

## Found while verifying (not part of the original 100)

- [x] **Editor password attempts were unthrottled, and the limiter silently
  capped every window at 60 seconds.** Found while explaining `EDITOR_SECRET`.
  All three editor endpoints called `checkEditorAuth` *before* any rate limit,
  so a wrong password cost nothing and could be retried without limit. New
  `checkEditorAuthThrottled`: 10 failures per IP per 5 minutes, counting
  **failures only** (so an editor saving fifty quizzes never approaches it) and
  clearing the record on success. A 503 for an unconfigured server is
  deliberately not counted — otherwise anyone could lock out the real editor
  before the secret was even set.

  Fixing it exposed a second bug: the limiter's cleanup pass pruned every key
  with a **hardcoded 60s cutoff**, so any window longer than a minute was
  silently truncated — the five-minute lockout would have reset itself a minute
  in. Windows are now recorded per key. 9 tests, and the whole thing verified
  against a running production build: 10 × 403, then 429; correct password
  still refused while locked out (that is the point); and success proven to
  clear the budget.


- [x] **A single letter won any two-letter typed answer.** Found by writing the
  first tests for `fuzzyMatch` (10.1). `isWithinDistance` floored the allowed
  edit distance at 1 regardless of word length, so on a two-character answer
  *any* single character matched: a fastest-finger question accepting "Au" was
  won by typing "a", or "e", and a player could simply spam vowels against the
  clock. Below four characters the answer must now be exact. Guarded by a
  generated regression test over **all 18 accepted-answer sets in the real quiz
  data**, confirming the tightening removed no legitimate match.

  Also documented, not changed: the last-word comparison runs at a 0.3 ratio,
  so a 7-letter answer tolerates two edits and "Cheetos" is credited for
  "Cheetah". Tightening that would start rejecting the ordinary typos the
  function exists to forgive, so it is asserted in a test named for what it is.


- [ ] **All 30 external quiz images are dead — 400, every one.** Found while
  testing the 6.10 preview, which rendered a blank frame for a zoom-out
  question. Checked all 30 with a link check: **0 working**. Diagnosis:
  Wikimedia has moved thumbnail serving to `thumb.wikimedia.org` *and* no
  longer allows arbitrary widths — the same file at `800px` returns 400 while
  `960px` on the new host returns 200. So this is not a host rewrite; each URL
  needs a valid thumb looked up through the Commons API.

  Worst hit is **`zoom-out-pictures`: all 15 questions**, i.e. the entire quiz,
  whose whole premise is a picture. `geography` (7), `european-geography` (6)
  and `oceans-and-continents` (2) are also affected.

  Not caused by routing images through the optimizer — the plain `<img>` tags
  in the editor fail identically. **Left open deliberately**: the durable fix is
  to download the 30 images into `public/quiz-images/` and stop depending on an
  external host that has now changed its URL scheme twice, but that is a
  content decision (≈2 MB into the repo) rather than a code fix.


- [x] **Five room actions ignored the server's response entirely.**
  `answer-year`, `answer-text`, `advance-wager`, `force-results` and
  `choose-powerup` were all `await fetch(...)` inside a try/catch with no
  `res.ok` check. `fetch` resolves on a 400, so `catch` never ran and every
  refusal was silent — a late typed answer, a spent power-up, a host action on
  a dead room all looked exactly like nothing happening. This also means
  **improvement 4.9 was only half-fixed**: I had made the multiple-choice path
  report refusals, but the year and fastest-finger paths still swallowed them.
  All five now go through one `postAction` helper that checks the response and
  surfaces the server's own message.


- [x] **"All questions" made a room impossible to create.** `play/page.tsx`
  sent a magic `999` for "all", relying on the server clamping it with
  `Math.min(questionCount, questions.length)`. The security pass then added
  `validateAction`, which caps `questionCount` at `MAX_QUESTION_COUNT` (100) —
  so `999` started failing validation and choosing "All questions" returned
  `Invalid questionCount` with no room created. Now sends the real available
  total, capped at the same limit the server enforces. Found on 2026-09-07 by
  driving the create flow in a browser; `POST /api/rooms` with
  `questionCount: 999` reproduced it directly.

## 1 · Game engine
`lib/multiplayer/room-store.ts`, `scoring.ts`, `types.ts`

- [x] **1.1 Team mode never auto-advanced on typed-answer questions.** The text and year submit paths omitted the team filter the multiple-choice path had, so `answered >= totalEligible` could never be true — every round of a team game on a `year-*` quiz hung until the raw timer expired. `room-store.ts`
- [x] **1.2 The wager phase could wedge the room forever.** It was the one state with no server-side timer and it waited on *every* active player, so a single client that never submitted froze everyone. Added `scheduleWagerTimer` and excluded disconnected players.
- [x] **1.4 Three copies of the answer-counting block.** Collapsed into one `countAndMaybeAdvance` helper — 1.1 existed precisely because the copies drifted.
- [x] **1.5 One dropped phone cost every later round its full timer.** Disconnected players still counted toward `totalEligible`. Now skipped.
- [x] **1.3 `getResultsPayload` still mutates scores.** Split. The fastest-answerer payout moved out into `applyFastestBonus`, which `showResults` calls exactly once per round. That matters because `getRoomSnapshot` does `room.cachedResults ?? getResultsPayload(room)` — so any player opening a stream while the cache happened to be empty would have **re-awarded the bonus just by connecting**, and only the cache-is-never-null invariant stood between that and a corrupted leaderboard. Verified programmatically: zero score/streak writes remain inside `getResultsPayload`. Verified live: the fastest of three correct answerers still gets exactly one 150 bonus.
- [x] **1.6 A second Freeze in one round burns a use and reports success.** Now refused *before* the use is deducted, with a real reason ("The timer is already frozen this round"), so the player keeps the power-up. Found while fixing it that the client **never checked the response** on `choose-powerup` — `fetch` resolves on a 400, so every rejection was silent. That turned out to be true of four more actions; see the note below.
- [x] **1.7 The wager cap is computed independently on client and server.** One `maxWagerFor(score)` in `scoring.ts`, used by both, with 4 unit tests including the crossover where the 500 floor gives way to the 30% share. The payload's `maxWager` field is gone: it was always the literal `0`, no consumer read it, and it implied a room-wide limit that never existed.
- [x] **1.8 Elimination ties always remove whoever joined first.** `Array.sort` is stable and the player list is in join order, so a tie removed the same person every time — which after a few rounds stops being chance and becomes a rule nobody agreed to. New `lowestScorers()` returns the whole tied group and the caller picks at random. 5 unit tests, including negative scores (slow penalties can go below zero).
- [x] **1.9 Dead `mysteryMultiplier` on both sides.** The `Map` was created and cleared but never written to, and `ResultsPayload.mysteryMultiplier` was never set — so both UI branches were unreachable. Removed from the room, the payload and both components; the type checker found the two dead branches for me.
- [x] **1.10 Magic numbers duplicated.** `FASTEST_BONUS` and `POWER_UP_USES` in `scoring.ts`. The `150` appeared three times — one of them the value awarded and another the value *reported* to the player, which is exactly the shape of drift that made 1.3 possible.

## 2 · API & security
`app/api/**`, `lib/auth.ts`, `lib/rate-limit.ts`, `lib/sanitize.ts`

- [x] **2.1 The SSE stream had no auth and no rate limit.** `playerId` came from a query param on trust — anyone with a room code could read the whole live feed and cancel another player's disconnect timer. Now membership-checked (player or host token), rate limited, and capped per room.
- [x] **2.2 `X-Forwarded-For` spoofing defeated every rate limiter.** nginx *appends* the real peer, so reading index `[0]` returned the attacker's own string — a fresh value per request bought a fresh bucket. New `lib/client-ip.ts` prefers `X-Real-IP`, else the last hop; five duplicated local copies deleted.
- [x] **2.6 `/api/network-url` could leak LAN topology in production.** Gated — but see the note below, the first attempt broke the QR code.
- [x] **2.10 `sanitizeText` stripped `&`, corrupting answers.** It runs on `answer-text` before `fuzzyMatch`, so "Fish & Chips" scored zero. `&` removed from the blocklist.
- [x] **2.3 No request-size cap before `req.json()`.** New `readJsonBody` in `lib/http.ts` checks `Content-Length` and then measures what actually arrived — a chunked request can omit the header, so the header check alone is a courtesy. 256 KB cap (quiz saves are the largest legitimate body and sit well under). Verified: a 300 KB body returns **413**.
- [x] **2.4 No security headers at all.** `X-Frame-Options: DENY` (the editor was iframeable while holding a bearer token in `sessionStorage`), plus `nosniff`, `Referrer-Policy` and HSTS, added alongside the caching headers for 9.10 and verified with `curl -I`. **No CSP** — this app leans on inline styles, and a real policy needs building and testing against the whole surface rather than guessing.
- [x] **2.5 `GET /api/rooms` returns full room state for a guessed 4-char code.** ~1.7M combinations with no per-code lockout, and it handed over every player's name, the live question, and during the results phase `correctAnswer` itself. Unauthenticated callers now get `{exists, state, playerCount}`; the snapshot requires a host or player token. **Also fixed while in there:** the host token was passed in the *query string*, so it landed in proxy logs, browser history and `Referer` — it moves to headers. The one client caller only ever read `isHost`. Both verified with `curl`.
- [x] **2.7 `GET /api/quizzes/[id]` has no rate limit and no cache.** 60/10s per IP plus `max-age=60, stale-while-revalidate=300`. The cache is the part that protects the box — a repeat request never reaches the filesystem — and it stays short because the editor rewrites these files in place.
- [x] **2.8 "Room not found" returns 403 on host actions.** One `statusFor()` maps not-found to 404, applied to all four host actions. A host whose room had been reaped — or lost on a deploy, since the store is in memory — was told they lacked permission for their own game, which sends you hunting an auth bug. Verified: 404.
- [x] **2.9 Zero server-side logging.** New `logServerError`, deliberately `console.error` and nothing else, because stderr on this box goes to the systemd journal. Applied to the failures that were genuinely hidden: an unreadable quiz file (which made a quiz silently vanish from every list), a failed quiz read or delete, a failed upload, a failed feedback send, and room creation. **Not** applied to body-parse failures — those are client errors and attacker-controllable noise. Documented never to log tokens, bodies or player names.

## 3 · Realtime & resilience
`sse-manager.ts`, `stream/route.ts`, `hooks/useRoom.ts`

- [x] **3.1 My own token-gating broke the `pagehide` beacon** — it never sent a token, so every clean exit silently fell back to the 120s grace timer. (I had wrongly reported this action as unused; it uses `sendBeacon`, which my grep missed.)
- [x] **3.2 Reconnecting never restored `connected: true`.** Only `joinRoom` ever set it, and the page re-opens SSE without re-joining — so a phone locked past the grace window came back permanently excluded from team rotation.
- [x] **3.4 No connection cap or auth on the stream.** Covered with 2.1.
- [x] **3.6 No jitter in the reconnect backoff.** A room-wide wifi blip put 30 phones in lockstep against one box.
- [x] **3.7 Action POSTs could hang forever.** Added an 8s `AbortSignal.timeout` with a distinguishable message.
- [x] **3.3 Lobby disconnects delete the player with no rejoin path.** Deletion stays — the host shouldn't wait on ghosts — but `postAction` now recognises "Invalid session", rejoins with the stored name and emoji (which `joinRoom` permits while the room is in the lobby), stores the new token and retries once. The first a player heard of this was their answer being refused.
- [x] **3.5 The client gives up permanently after 3 minutes.** It stopped dead after 200 tries or three minutes with nothing to reschedule it, so a phone that locked during a long question came back permanently broken while the room was still running. The fast jittered backoff is now bounded at 20 attempts and then continues on a slow 15s interval indefinitely — cheap, and the only thing that can recover a phone left face-down. The dead `disconnectTimer` ref went with it.
- [x] **3.8 `EventSource` can't tell "room gone" from "network blip".** It exposes no status code, so a reaped room and a dropped packet arrive as the identical `onerror` — and the client retried a dead room forever while saying "connection lost". One cheap probe of `GET /api/rooms` settles it (404 only when the room is genuinely gone) and the player is told "This game has ended."
- [x] **3.9 `timer-reduced` isn't in the reconnect snapshot.** It was a one-shot event, so anyone who reconnected after a Freeze rebuilt their countdown from the original duration, ran seconds behind the room, and then had their answer refused by a question that had already closed. The snapshot now carries `timerReduction` and `useRoom` applies it. `FREEZE_SECONDS` replaced the literal `3` in the event, the snapshot and the server timer maths.
- [x] **3.10 Connections pruned during `broadcast` don't start the disconnect timer.** They were deleted from the map and the room store never heard, so the grace timer waited for the next heartbeat — up to 15 seconds during which the departed player still counted toward `totalEligible` and the whole room sat waiting on them. `broadcast` now reports prunes through a registered handler (a hook, not an import, since `room-store` imports the SSE manager).

## 4 · Player UI (phone)
`components/multiplayer/Player*`, `JoinForm`, inputs

- [x] **4.3 Dead ternary in the spectator answer grid.** Both branches were `grid-cols-2`, so true/false questions rendered cramped for spectators only.
- [x] **4.1 The "waiting for others" screen shows nothing.** Now a progress bar and "1 of 3 answered". `answerCount` was already broadcast room-wide and only the host read it. Verified in a live game.
- [x] **4.2 Eliminated players are shown "No Answer" every round.** Now "Spectating" with an eye icon. Needed a persistent `eliminated` prop — `eliminatedThisRound` only covers the round they went out, so every round after still read as a missed tap.
- [x] **4.4 A player never learns their rank.** The results screen now shows rank, movement since last round (`previousRank`) and score. All three were already in every payload. Verified live: `1 /3 · 0 pts`.
- [x] **4.5 The streak badge only exists on the multiple-choice path.** `StreakBadge` added to `FastestFingerInput` and `YearGuesserInput`, with `streak` passed at all four call sites. The streak was always counted, just never shown on those screens.
- [x] **4.6 No haptic on the result reveal.** `PlayerResults` now fires `commit` on a correct answer and the previously-uncalled `error` pattern on a wrong one. (Can't be observed in a desktop browser; `lib/haptics.ts` no-ops without the API and under reduced-motion.)
- [x] **4.7 PlayerLobby says nothing about the game.** Now shows mode, question count and your team. This needed `totalQuestions` plumbed through `useRoom` — it was in every snapshot and unread, so the page had been falling back to a hardcoded `15`.
- [x] **4.8 Answer buttons stay bright and tappable while reconnecting.** Disabled and dimmed to 40% while the stream is down, with "Reconnecting — your tap won't count yet".
- [x] **4.9 A late tap looks identical to never answering.** `onAnswer` now resolves to a boolean; a refusal puts the choice back and says "That didn't go through — tap again". The toast also shows the server's own reason instead of a generic failure.
- [x] **4.10 Join stays disabled with no reason.** The first unmet requirement is named under the button and wired up with `aria-describedby`. Verified live: "Enter the room code" → "Enter your name" → enabled.

## 5 · Host UI (big screen)
`components/multiplayer/Host*`, `Leaderboard`, `AnswerDistribution`

- [x] **5.9 The join URL was printed at 12px / 30% opacity** — unreadable from across a room, redundant with the QR and room code. Now screen-reader only.
- [x] **5.1 The host has no "Reveal now" button.** Added, next to the answer count. `forceShowResults` already existed in `room-store.ts:1306`, was already wired into `POST /api/rooms` and already validated — and the client already called it from `handleTimerExpire`. It just had no manual trigger.
- [x] **5.2 The answer count has no denominator.** Now renders `7/8`. (The item used to claim `total` was "destructured and never read" — it *was* read for `allAnswered`, just never displayed.)
- [x] **5.3 Team mode never shows whose turn it is.** An "Answering" banner now names the current answerers, with their team, on the projected screen. `currentTeamAnswerers` was already in the question payload; only the phones ever used it.
- [x] **5.4 The lobby never shows team assignments.** The host lobby now groups players under team headings with per-team counts, plus a "Not assigned" group for anyone the server hasn't placed yet.
- [x] **5.5 Ties render as distinct ranks.** New `competitionRanks()` in `scoring.ts`: 4200, 4200, 3000 now ranks 1, 2, 2, 4 rather than by array position. Covered by 6 unit tests — the first tests over anything in `lib/multiplayer`.
- [x] **5.6 The lobby player grid has no cap or scroll.** Capped at `42vh` with internal scroll so Start can never be pushed off a screen nobody can scroll, and tiles shrink past 16 players so a big room still fits.
- [x] **5.7 The wager phase is a dead screen.** Each avatar now shows whether that player has locked in, with an `n/total` count and the button naming how many are still deciding. Required a new `hasWagered` boolean on `PlayerInfo` — deliberately a boolean and never the amount, since a visible wager isn't a wager.
- [x] **5.8 The explanation is the smallest, dimmest text on the reveal.** Already fixed by the redesign (commit `a440431`) and never re-marked: it renders at `sm:text-xl` / `text-white/85`, under a `sm:text-3xl` question. Verified 2026-09-07.
- [x] **5.10 Team mode buries the team score.** The team scores were `text-sm` chips *below* the full individual leaderboard; they now sit above it as large count-up panels, leader ringed, with the individual table kept underneath.

## 6 · Content & editor
`app/editor/**`, `lib/quiz-store.ts`, `data/quizzes`

- [x] **6.1 Saving a year-guesser or fastest-finger quiz silently deleted every question.** Those types are answered by typing so their `options` stay `["","","",""]`, and the save filter required a non-blank option. **Verified: 6 files, 81 questions** — five would have lost all 15.
- [x] **6.2 Quizzes made in the editor never appear in the game-creation flow.** `TOPICS` is a hand-maintained id list, so anything the editor created had an id nobody had listed and became unselectable — you could build a quiz and then never find it to play. Topics now match by prefix as well as id, and anything no topic claims appears under a synthetic "More" heading rather than vanishing.
- [x] **6.3 The news-quiz generator writes ids no topic lists.** The `news` topic hardcoded eight ids (`news-2024-q1`…`news-2025-q4`) while the generator writes `news-<topic>-<date>` — so every quiz that cron produced was invisible in the game flow and deleted itself three days later. The topic now carries `idPrefix: "news-"`, which cannot go stale the way a list does. Verified: `news-tech-2026-09-07` now lands in News.
- [x] **6.4 No duplicate/fork.** A copy button on each row reads the quiz, posts a `(copy)` with the same questions, and opens it for editing.
- [x] **6.5 No unsaved-changes warning.** A `beforeunload` guard armed by comparing a fingerprint of the editable state against whatever was last loaded or saved — so it only fires when something genuinely differs. A prompt that cries wolf gets dismissed reflexively, which is worse than none.
- [x] **6.6 No search over 54 quizzes.** A search box over title and id in the editor, shown only once the list exceeds 8. `/library` searches question *text* across every quiz, which is a different job. Verified: "bluff" narrows 54 → 5.
- [x] **6.7 The question-type selector has no visible selected state.** Both branches were `bg-white/5`; the only difference was `text-white/80` versus `/50`, indistinguishable in practice — you could not tell what type a question was. Selected is now solid `#ff9062` on near-black, with `aria-pressed`.
- [x] **6.8 Save allows unanswerable questions.** `zoom-out` without an image (nothing to zoom) and `fastest-finger` without accepted answers (no answer can ever be right) both saved cleanly and then failed mid-game in front of everyone. Both now rejected at validation. Checked all 54 existing quizzes first: **0 would be rejected**, so this blocks new mistakes without breaking existing content.
- [x] **6.9 `emoji` is a dead field with an orphaned i18n key.** Nothing rendered it — `quiz-theme` resolves from `icon` — yet it was carried through the type, `QuizMeta`, the validator and both write endpoints. Removed end to end, along with the `editor.emoji` key. The 54 JSON files keep an unread `emoji` key, which is harmless; the next save of each drops it.
- [x] **6.10 No preview.** New `QuestionPreview`: the question, image and answer grid with a **scrub slider for the clock**, because the two things you couldn't check without starting a real game — progressive reveal and zoom-out crops — depend entirely on where the timer is. Uses the same `QuizImage` and answer palette as the game so it can't drift. Also surfaces the missing year / accepted answers that 6.8 now blocks. **Finding it blank for a zoom-out question is what uncovered the 30 dead images above.**

## 7 · Design system
`app/globals.css`, `components/ui`, `lib/answer-options.ts`

- [x] **7.1 Plus Jakarta Sans never rendered anywhere.** `font-[var(--font-headline)]` compiles to `font-weight: var(--font-headline)` — invalid, dropped. Confirmed in the built CSS: `font-family: var(--font-…)` appeared **zero** times. The font was downloaded on every page load and never used. Replaced with real `.font-headline`/`.font-body` classes at all 12 call sites.
- [x] **7.5 No danger button class.** `ConfirmDialog` hand-rolled one and re-implemented `.btn-secondary` beside it. Added `.btn-danger`.
- [x] **7.8 The body font was a hardcoded literal**, disconnected from the next/font variable.
- [x] **7.10 `.btn-primary` had no `:disabled` state** — call sites had invented three different opacities.
- [x] **7.2 `QuizCard.tsx` re-duplicates the answer palette.** Solo mode re-spelled all four colours and icons, one edit from drifting away from the multiplayer screens that had already been consolidated. Now derived from `ANSWER_BG` / `ANSWER_ICONS`.
- [x] **7.3 CLAUDE.md's documented palette no longer matches the code.** Done in the redesign session but never re-marked: the doc now names `src/lib/answer-options.ts` as the single source of truth and its table matches the code (`#ff716c` `#43a5fc` `#66bb6a` `#c9a825`). Verified 2026-09-07.
- [x] **7.4 Raw hex literals duplicating 12 defined tokens.** **256 arbitrary colour utilities replaced with `@theme` tokens** across 42 files (`bg-[#ff9062]` → `bg-primary`, and so on). **613 literals across 58 files → 371 across 28.** The remainder is deliberate: flag specs, avatar palettes, quiz themes and creature art, where a hex is a *fact* and not a design choice — tokenising `#009c3b` would be a lie about what it is. Verified the token classes generate and the arbitrary ones are gone from the built CSS, and that the home screen renders identically.
- [x] **7.6 Three different glass recipes.** The two hand-built ones on the home screen were byte-for-byte `.glass` with a larger blur, so they now use `.glass`. Documented in CLAUDE.md that this combination *is* `.glass` and shouldn't be re-rolled.
- [x] **7.7 Five competing border radii with no documented scale.** Now four steps plus `full`, documented at the top of the `.glass` block in `globals.css` and in CLAUDE.md: `lg` small controls · `xl` inputs and rows · `2xl` cards · `3xl` hero surfaces · `full` pills. The two stray `rounded-md` uses were normalised; `md`/`sm` are now explicitly unused, because three near-identical small radii is a distinction nobody can see and everybody has to decide about.
- [x] **7.9 Two hover systems race on the player answer buttons.** `.answer-btn` already applies `filter: brightness(1.15)` *and* turns it off under `prefers-reduced-motion`; the Tailwind `hover:brightness-110` layered on top fought it and skipped the guard. The utility is gone from `BUTTON_COLORS` and `QuizCard`, leaving `.answer-btn` as the single owner. The remaining `hover:brightness` utilities are on standalone buttons where nothing competes.

## 8 · Accessibility

- [x] **8.1 Answer text failed contrast on its own background.** Measured white-on-colour at **2.30–2.68:1** — below even the 3:1 large-text floor, on the most-read element in the game. Black measures **7.20–8.38:1**. Verified independently before changing it, and it matches CLAUDE.md's own `btn-primary` rule.
- [x] **8.2 No `aria-live` anywhere.** New `LiveRegion` — one polite region, because concurrent live regions interrupt each other and the result is worse than silence. It announces, in order of urgency: connection lost, eliminations, players leaving, the answer count, results, game over. Written straight to the node rather than through state (a live region is a platform API), with an alternating zero-width space so the *same* message twice in a row is still spoken. Verified live: "1 of 3 players have answered."
- [x] **8.3 The countdown has no accessible equivalent.** The digits carry `role="timer"` with `aria-hidden` on the value and the bar is `aria-hidden` — a 10Hz countdown inside a live region would talk over the entire game. Instead the time is spoken only at the moments that change a decision: 30, 10, 5, 3 and zero, each once. Verified live on a 12-second clock: "5 seconds left." → "3 seconds left." → "Time is up."
- [x] **8.4 `text-white/30` (2.64:1) and `/40` (3.79:1) fail AA.** Recomputed against `#0e0e0e` and confirmed the tracker's figures exactly. Raised across **91 occurrences**: `/30` → `/45` (2.63 → **4.50:1**) and `/40` → `/50` (3.79 → **5.30:1**), both now passing AA for body text. That included 16 `placeholder:` uses — placeholder text conveys the expected format, so it was raised too, accepting that placeholders now sit closer to real input.
- [x] **8.5 Quiz images are `alt=""`.** `alt=""` tells a screen reader an image is decorative, but on a picture round the image *is* the question — so a blind player was told nothing was there rather than that they were missing the whole thing. The default now names the image's **role** and deliberately not its contents: "a photo of the Eiffel Tower" would answer "which landmark is this?", the exact case WCAG 1.1.1 carves out for tests. This is a partial answer to a real tension, not a clean fix — it lets the player know to ask instead of silently losing the round.
- [x] **8.6 Every route reports the same document title.** Every page here is a client component and so cannot export `metadata`; each route now has a thin layout that carries it, plus a `title.template` in the root. `/play/[code]` uses `generateMetadata` to put the **room code** in the tab, because hosts routinely have the big screen and their own phone open and both said "Quizmo". Verified: `Tint · Quizmo`, `Library · Quizmo`, `Room E7LC`.
- [x] **8.7 The wager slider has no accessible name.** `aria-label`, plus `aria-valuetext` giving units — a bare "450" says nothing about what is being staked — and `aria-describedby` pointing at the big amount readout.
- [x] **8.8 No keyboard shortcut to answer.** Number keys 1-4, bound to the document so nothing has to be focused first, ignored while a text field has focus, and matched on `e.code` so they work on layouts where the unshifted key isn't a digit. Buttons carry `aria-keyshortcuts` and a real `aria-label` ("Answer 2: Flock"), with the number shown on screen at `sm` and up. Verified live: pressing `2` locked the answer in.
- [x] **8.9 Join errors aren't announced or associated with a field.** The error is now `role="alert"` / `aria-live="assertive"`, and the room-code field gets `aria-invalid` and `aria-describedby` pointing at it — a wrong code produced no feedback at all for a screen-reader user before.
- [x] **8.10 The leaderboard is div soup.** The rest-of-field is a real `<ol>` with `<li>` rows, an `aria-label`, and `start` continuing from the podium instead of restarting at 1 — so it reads as a ranking with a length and a position, not a stream of names and numbers.

## 9 · Performance

- [x] **9.1 The DiceBear engine is 300KB of `/play`'s first load.** Deferred with `next/dynamic`: the avatar picker is the only thing needing the engine, and it isn't rendered until you pick an avatar — so anyone tapping "Create game" paid for it for nothing. Measured on a production build: **`/play` initial JS 943 KB → 645 KB** (-298 KB uncompressed). The item's ~300 KB figure was right. Picker verified still working.
- [x] **9.2 Full-size quiz images fan out to every phone at once.** New `QuizImage` routes every question picture through Next's optimizer (webp, per-device sizing, q=65); `upload.wikimedia.org` allow-listed explicitly for the 30 external references. `redwood.jpg`: **294 KB → 83 KB** at 384px, 122 KB at 480px. My first attempt used `fill`, which collapsed every wrapper to zero width and made the pictures vanish — caught in the browser and rebuilt with explicit dimensions.
- [x] **9.3 `answer-count` is broadcast room-wide but only the host renders it.** Resolved by inverting the premise rather than the traffic: improvement **4.1** now renders the count on the players' own waiting screen, so every recipient uses it. The payload is `{count, total}`, a few dozen bytes, and it is no longer wasted.
- [x] **9.4 One power-up tap re-broadcasts the entire room snapshot to everyone.** New `power-up-used` event carrying only who spent what and that player's remaining budget; `useRoom` patches the two fields that read it instead of replacing the room.
- [x] **9.5 `PlayerQuestion` re-renders at 10Hz on every question.** The unconditional `useCountdown` fed a zoom value only zoom-out questions use. Moved into a `ZoomOutImage` leaf, so no other question type pays for the ticking. (`useProgressiveReveal` already no-ops when disabled, so this was the only unconditional ticker.)
- [x] **9.6 `HostQuestion` inlines its own countdown.** Split into `TimerBar` and `TimerCircle` leaves in `CountdownVisuals.tsx`, so the 10Hz re-render no longer rebuilds the question card, the image and the 2×2 answer grid on a TV. Timer and expiry verified live.
- [x] **9.7 The lobby preloads a 5.3MB 320kbps MP3 the moment the host arrives.** `useSound` no longer constructs any `Audio` on mount; the element is created on first play with `preload="none"`. The lobby starts **muted**, so the normal session paid 5.3 MB for music it never played — over the same venue wifi serving thirty phones. Verified on a real host lobby: no audio fetched; `load()` still reaches `readyState 4`.
- [x] **9.8 `results.en` duplicates strings already in the payload.** `en.correctAnswerText` and `en.explanation` were copies of the fields beside them — a translation envelope left from the bilingual era. Dropped; the shuffled options it also carried were the one real payload, so they moved up to `ResultsPayload.options`. Found while doing it: **`QuestionPayload.en` was never populated by the server at all**, so 8 call sites read a field that never existed. Removed too.
- [-] **9.9 `translations.ts` is 11.4KB of single-language dictionary in the gameplay bundle.** Rejected. Measured: 11.2 KB raw, **3.2 KB gzipped** — and removing the layer means editing 237 `t(...)` call sites across 31 files, every one a chance to break a live screen. Bad trade. Revisit only if a second language comes back, at which point the layer earns its keep.
- [x] **9.10 No `Cache-Control` for `public/`.** A `headers()` block gives images, audio and fonts a year of `immutable` (they are content-named by hand), with `no-cache` kept for the Tint manifest, which is edited in place. Verified with `curl -I`.

## 10 · Tooling & DX

- [x] **10.3 No `typecheck`, `test` or `clean` script.** Added, plus `qa` wiring `scripts/qa-monitor.sh` which nothing referenced.
- [x] **10.6 `.env.example` didn't mention `ANTHROPIC_API_KEY`**, required by `npm run news-quiz`.
- [x] **10.7 README was 100% unedited create-next-app boilerplate.** Replaced with real architecture, commands, deploy topology and the two known deploy gaps.
- [x] **10.1 No test framework.** Done. **130 tests across 9 files**, up from zero this morning and 57 at the last count — and now covering the modules this item named: `scoring` (competition ranks, wager cap, elimination ties), `fuzzy-match`, `sanitize` and `quiz-validate`. Writing them **found a real exploit**: see the note below. `room-store` is still untested — it is module-level mutable state plus timers, so it needs a harness rather than a test file, and that is honestly out of scope here.
- [x] **10.2 `noUncheckedIndexedAccess` is off.** Partly done, with the cost measured rather than guessed. Five stricter flags are now **on** and cost nothing: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noImplicitOverride` — enabling the first two flushed out 8 dead locals and parameters, including two in `HostResults` left behind by 9.8. `noUncheckedIndexedAccess` itself reports **163 errors** and is deliberately left off: nearly all would be silenced with a `!`, which buys no safety and hides the few sites where an out-of-range index is genuinely reachable. Also measured: `noPropertyAccessFromIndexSignature` 194, `exactOptionalPropertyTypes` 23. All recorded in `tsconfig.json` so the next person inherits the numbers, not the question.
- [x] **10.4 No formatter configured.** Prettier installed and configured, with `format` / `format:check` scripts. `data/quizzes/` is ignored — reformatting 54 content files would bury every real content change in whitespace — as are `public/` and the `next dev`-managed block in CLAUDE.md. **Deliberately not run across the repo yet**: it would touch 98 files and make this session's work unreviewable. That belongs in its own commit.
- [x] **10.5 Lint warnings never fail CI.** `npm run lint` now carries `--max-warnings 16`, the count after this session's cleanup (it was 32 at the start). CI runs it, so the number can only come down. `exhaustive-deps` is left as a warning rather than promoted: there are legitimate cases here where the dependency list is deliberately incomplete, and each needs reading rather than a blanket rule.
- [x] **10.8 No pre-commit hook.** `.githooks/pre-commit` runs typecheck, lint and tests in seconds. Install with `git config core.hooksPath .githooks` (documented in the README). It deliberately skips `next build` — slow enough that people reach for `--no-verify`, and a hook everyone bypasses is worse than none. It also refuses to commit build output or the `" 2"` conflict copies iCloud keeps creating in this directory, which have broken `tsc` twice today.
- [x] **10.9 CI has no post-deploy health check.** A green tick meant only that `ssh` returned 0 — which it does even when the app then fails to boot and systemd leaves it down. CI now polls the live site until it answers 200, then checks `/api/quizzes` (the endpoint a deploy most often breaks, since it reads the quiz files), and fails the run with a pointer to the rollback steps if either doesn't come back. CI also now runs the **test suite**, which it never did.
- [x] **10.10 No rollback path.** Documented in the README as `git revert && git push`, which re-runs the full pipeline and redeploys — no SSH. The README also explains *why not* to SSH in and `git checkout <sha>`: that leaves the box on a detached HEAD which the next deploy silently overwrites, so the fix appears to work and then undoes itself. SSH is reserved for a wedged box on a good `master`.

---

## Regressions I introduced and caught

Worth recording, because two were caused by earlier fixes in this same session:

1. **`.tap-target` set `position: relative`**, overriding Tailwind's `fixed` — the game's exit button became a 1291px bar across the top. Caught by driving the app in Chrome.
2. **Token-gating `disconnect` broke the `pagehide` beacon** (3.1). I had reported that action as unused; it uses `sendBeacon`, which my grep missed.
3. **Gating `/api/network-url` in production killed the QR code** — it rendered `undefined/play?code=XXXX`. The Host-header branch is the one prod actually needs; only the LAN enumeration should be dev-only. The client now falls back to `window.location.origin` on any bad response.

---

## How this list was built

Ten agents read the codebase in parallel, one per area, each told what had
already been fixed today so they would not re-report it. Every claim was to be
verified against real code rather than guessed. Items that turned out to be
wrong or not worth doing are kept here marked `[-]` with the reason, so the
same idea does not get re-proposed later.
