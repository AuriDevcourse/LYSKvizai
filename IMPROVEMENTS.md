# Quizmo — 100 improvements

Ten areas (see `AREAS.md`), ten improvements each, found by a parallel analysis
pass over the codebase on 2026-09-06.

Status: `[ ]` open · `[x]` done · `[~]` partial · `[-]` rejected, with a reason

Each item carries the `file:line` it was found at. Line numbers drift as the work
lands — treat them as a starting point, not gospel.

## 1 · Game engine
`lib/multiplayer/room-store.ts`, `scoring.ts`, `types.ts`

- [x] **1.1 Team mode never auto-advanced on typed-answer questions.** The text and year submit paths omitted the team filter the multiple-choice path had, so `answered >= totalEligible` could never be true — every round of a team game on a `year-*` quiz hung until the raw timer expired. `room-store.ts`
- [x] **1.2 The wager phase could wedge the room forever.** It was the one state with no server-side timer and it waited on *every* active player, so a single client that never submitted froze everyone. Added `scheduleWagerTimer` and excluded disconnected players.
- [x] **1.4 Three copies of the answer-counting block.** Collapsed into one `countAndMaybeAdvance` helper — 1.1 existed precisely because the copies drifted.
- [x] **1.5 One dropped phone cost every later round its full timer.** Disconnected players still counted toward `totalEligible`. Now skipped.
- [ ] **1.3 `getResultsPayload` still mutates scores.** Only call-site discipline (`cachedResults`) stops double-awarding. Split into a pure `computeResults` + explicit `applyFastestBonus`. (audit.md C5)
- [ ] **1.6 A second Freeze in one round burns a use and reports success.** Only the first actually cuts the timer; everyone who picked it is told "Froze the timer!". Track the owner or refund the use.
- [ ] **1.7 The wager cap is computed independently on client and server.** `getWagerPayload` sends `maxWager: 0` and the client re-implements `max(500, 30%)`. Send the real number.
- [ ] **1.8 Elimination ties always remove whoever joined first.** `sort` is stable over join order. Shuffle the tied group.
- [ ] **1.9 Dead `mysteryMultiplier` on both sides.** Server never populates it; two UI branches still render it.
- [ ] **1.10 Magic numbers duplicated.** `150` in three places, `3` power-up uses in two. Move to `scoring.ts` constants.

## 2 · API & security
`app/api/**`, `lib/auth.ts`, `lib/rate-limit.ts`, `lib/sanitize.ts`

- [x] **2.1 The SSE stream had no auth and no rate limit.** `playerId` came from a query param on trust — anyone with a room code could read the whole live feed and cancel another player's disconnect timer. Now membership-checked (player or host token), rate limited, and capped per room.
- [x] **2.2 `X-Forwarded-For` spoofing defeated every rate limiter.** nginx *appends* the real peer, so reading index `[0]` returned the attacker's own string — a fresh value per request bought a fresh bucket. New `lib/client-ip.ts` prefers `X-Real-IP`, else the last hop; five duplicated local copies deleted.
- [x] **2.6 `/api/network-url` could leak LAN topology in production.** Gated — but see the note below, the first attempt broke the QR code.
- [x] **2.10 `sanitizeText` stripped `&`, corrupting answers.** It runs on `answer-text` before `fuzzyMatch`, so "Fish & Chips" scored zero. `&` removed from the blocklist.
- [ ] **2.3 No request-size cap before `req.json()`/`formData()`.** App Router has no default limit; the body is buffered before any field check. Return 413 above ~100KB.
- [ ] **2.4 No security headers at all.** No CSP, `X-Frame-Options`, `nosniff` or HSTS. The editor is iframeable and its bearer token sits in `sessionStorage`.
- [ ] **2.5 `GET /api/rooms` returns full room state for a guessed 4-char code.** ~1M combinations, no per-code lockout. Return `{exists, state}` without proof of membership.
- [ ] **2.7 `GET /api/quizzes/[id]` has no rate limit and no cache.** It returns the full answer key — the best scrape target in the API and the only unthrottled GET.
- [ ] **2.8 "Room not found" returns 403 on host actions** but 404 on GET. Distinguish not-found from forbidden.
- [ ] **2.9 Zero server-side logging.** Every catch discards the error; production failures leave no trace in the journal.

## 3 · Realtime & resilience
`sse-manager.ts`, `stream/route.ts`, `hooks/useRoom.ts`

- [x] **3.1 My own token-gating broke the `pagehide` beacon** — it never sent a token, so every clean exit silently fell back to the 120s grace timer. (I had wrongly reported this action as unused; it uses `sendBeacon`, which my grep missed.)
- [x] **3.2 Reconnecting never restored `connected: true`.** Only `joinRoom` ever set it, and the page re-opens SSE without re-joining — so a phone locked past the grace window came back permanently excluded from team rotation.
- [x] **3.4 No connection cap or auth on the stream.** Covered with 2.1.
- [x] **3.6 No jitter in the reconnect backoff.** A room-wide wifi blip put 30 phones in lockstep against one box.
- [x] **3.7 Action POSTs could hang forever.** Added an 8s `AbortSignal.timeout` with a distinguishable message.
- [ ] **3.3 Lobby disconnects delete the player with no rejoin path.** They're removed from `room.players` and only find out when their first answer returns "Invalid session".
- [ ] **3.5 The client gives up permanently after 3 minutes.** Nothing reschedules; recovery needs a visibility/online event. Drop to a slow steady retry instead.
- [ ] **3.8 `EventSource` can't tell "room gone" from "network blip".** A reaped room retries forever and reports "connection lost" instead of "this game ended".
- [ ] **3.9 `timer-reduced` isn't in the reconnect snapshot.** Reconnect during a Freeze and your countdown disagrees with everyone else's.
- [ ] **3.10 Connections pruned during `broadcast` don't start the disconnect timer** until the next heartbeat, up to 15s later.

## 4 · Player UI (phone)
`components/multiplayer/Player*`, `JoinForm`, inputs

- [x] **4.3 Dead ternary in the spectator answer grid.** Both branches were `grid-cols-2`, so true/false questions rendered cramped for spectators only.
- [ ] **4.1 The "waiting for others" screen shows nothing.** `answerCount` is computed and sent to the room but only the host renders it. Show `{count}/{total}`.
- [ ] **4.2 Eliminated players are shown "No Answer" every round** — the same failure state as someone who forgot to tap. Render "Spectating".
- [ ] **4.4 A player never learns their rank.** `rank`/`previousRank` are already in every results payload.
- [ ] **4.5 The streak badge only exists on the multiple-choice path.** Fastest-finger and year-guesser never show it.
- [ ] **4.6 No haptic on the result reveal.** `lib/haptics.ts` defines an `error` pattern that nothing calls.
- [ ] **4.7 PlayerLobby says nothing about the game** — not the mode, not the question count.
- [ ] **4.8 Answer buttons stay bright and tappable while reconnecting**, inviting a tap that silently fails.
- [ ] **4.9 A late tap looks identical to never answering.**
- [ ] **4.10 Join stays disabled with no reason** until an avatar is picked.

## 5 · Host UI (big screen)
`components/multiplayer/Host*`, `Leaderboard`, `AnswerDistribution`

- [x] **5.9 The join URL was printed at 12px / 30% opacity** — unreadable from across a room, redundant with the QR and room code. Now screen-reader only.
- [ ] **5.1 The host has no "Reveal now" button.** During a question their only control is the X that quits the room. `forceShowResults` already exists and doesn't require the timer to have expired.
- [ ] **5.2 The answer count has no denominator.** `total` is destructured and never read — the host sees "7" with no idea if that's 7 of 8 or 7 of 30.
- [ ] **5.3 Team mode never shows whose turn it is** on the one screen everybody is looking at.
- [ ] **5.4 The lobby never shows team assignments.**
- [ ] **5.5 Ties render as distinct ranks** — two players on 4200 shown as 2nd and 3rd.
- [ ] **5.6 The lobby player grid has no cap or scroll.** At 30 players it pushes Start off a TV that can't be scrolled.
- [ ] **5.7 The wager phase is a dead screen** with no progress count — the most dramatic moment in the game, flown blind.
- [ ] **5.8 The explanation is the smallest, dimmest text on the reveal** despite being the payoff.
- [ ] **5.10 Team mode buries the team score** under a full individual leaderboard.

## 6 · Content & editor
`app/editor/**`, `lib/quiz-store.ts`, `data/quizzes`

- [x] **6.1 Saving a year-guesser or fastest-finger quiz silently deleted every question.** Those types are answered by typing so their `options` stay `["","","",""]`, and the save filter required a non-blank option. **Verified: 6 files, 81 questions** — five would have lost all 15.
- [ ] **6.2 Quizzes made in the editor never appear in the game-creation flow.** `TopicPicker` only shows ids hardcoded in `lib/topics.ts`. `QuizPicker.tsx` would solve it and is imported nowhere.
- [ ] **6.3 The news-quiz generator writes ids no topic lists** — a cron whose output is invisible and self-deletes after 3 days.
- [ ] **6.4 No duplicate/fork.** Rebuilding a 15-question variant means retyping it.
- [ ] **6.5 No unsaved-changes warning.**
- [ ] **6.6 No search over 54 quizzes.**
- [ ] **6.7 The question-type selector has no visible selected state** — both states are `bg-white/5`.
- [ ] **6.8 Save allows unanswerable questions** — zoom-out with no image, fastest-finger with no accepted answers.
- [ ] **6.9 `emoji` is a dead field** on all 54 files with an orphaned i18n key.
- [ ] **6.10 No preview.** Progressive reveal and zoom crops can only be checked by starting a real game.

## 7 · Design system
`app/globals.css`, `components/ui`, `lib/answer-options.ts`

- [x] **7.1 Plus Jakarta Sans never rendered anywhere.** `font-[var(--font-headline)]` compiles to `font-weight: var(--font-headline)` — invalid, dropped. Confirmed in the built CSS: `font-family: var(--font-…)` appeared **zero** times. The font was downloaded on every page load and never used. Replaced with real `.font-headline`/`.font-body` classes at all 12 call sites.
- [x] **7.5 No danger button class.** `ConfirmDialog` hand-rolled one and re-implemented `.btn-secondary` beside it. Added `.btn-danger`.
- [x] **7.8 The body font was a hardcoded literal**, disconnected from the next/font variable.
- [x] **7.10 `.btn-primary` had no `:disabled` state** — call sites had invented three different opacities.
- [ ] **7.2 `QuizCard.tsx` re-duplicates the answer palette** consolidated earlier today. Solo mode drifts next.
- [ ] **7.3 CLAUDE.md's documented palette no longer matches the code.** Anyone "correcting" the code from the doc would revert today's fix.
- [ ] **7.4 294 raw hex literals across 39 files** duplicating 12 defined tokens.
- [ ] **7.6 Three different glass recipes** — `.glass`, `border-white/5`, and a hand-built `backdrop-blur-2xl`.
- [ ] **7.7 Five competing border radii** with no documented scale.
- [ ] **7.9 Two hover systems race on the player answer buttons**, and the Tailwind one skips the reduced-motion guard.

## 8 · Accessibility

- [x] **8.1 Answer text failed contrast on its own background.** Measured white-on-colour at **2.30–2.68:1** — below even the 3:1 large-text floor, on the most-read element in the game. Black measures **7.20–8.38:1**. Verified independently before changing it, and it matches CLAUDE.md's own `btn-primary` rule.
- [ ] **8.2 No `aria-live` anywhere.** Elimination, reconnection, answer counts — all silent for screen readers. (WCAG 4.1.3)
- [ ] **8.3 The countdown has no accessible equivalent.**
- [ ] **8.4 `text-white/30` (2.64:1) and `/40` (3.79:1) fail AA** and carry real copy on the home screen. `/50` is the minimum that passes.
- [ ] **8.5 Quiz images are `alt=""`** — for a picture round the image *is* the question.
- [ ] **8.6 Every route reports the same document title.**
- [ ] **8.7 The wager slider has no accessible name.**
- [ ] **8.8 No keyboard shortcut to answer.** Number keys 1-4 are the convention in a timed game.
- [ ] **8.9 Join errors aren't announced or associated with a field.**
- [ ] **8.10 The leaderboard is div soup**, not an ordered list.

## 9 · Performance

- [ ] **9.1 The DiceBear engine is 300KB of `/play/[code]`'s 925KB first load** — shipped to every phone to draw a few small avatars. Render server-side or dynamic-import.
- [ ] **9.2 Full-size quiz images fan out to every phone at once.** `redwood.jpg` is 301KB for a slot displayed ~200px tall; 30 players ≈ 9MB on one AP for one question.
- [ ] **9.3 `answer-count` is broadcast room-wide but only the host renders it** — ~900 message deliveries per question that 30 phones parse for nothing.
- [ ] **9.4 One power-up tap re-broadcasts the entire room snapshot** to everyone.
- [ ] **9.5 `PlayerQuestion` re-renders at 10Hz on every question**, because `useCountdown` is called unconditionally for a value only zoom-out reads.
- [ ] **9.6 `HostQuestion` inlines its own countdown**, re-rendering the whole projected screen 10×/sec.
- [ ] **9.7 The lobby preloads a 5.3MB 320kbps MP3** the moment the host arrives.
- [ ] **9.8 `results.en` duplicates strings already in the payload** — an English-to-English translation tax.
- [ ] **9.9 `translations.ts` is 11.4KB of single-language dictionary** in the gameplay bundle.
- [ ] **9.10 No `Cache-Control` for `public/`** — Next only auto-caches `_next/static`.

## 10 · Tooling & DX

- [x] **10.3 No `typecheck`, `test` or `clean` script.** Added, plus `qa` wiring `scripts/qa-monitor.sh` which nothing referenced.
- [x] **10.6 `.env.example` didn't mention `ANTHROPIC_API_KEY`**, required by `npm run news-quiz`.
- [x] **10.7 README was 100% unedited create-next-app boilerplate.** Replaced with real architecture, commands, deploy topology and the two known deploy gaps.
- [~] **10.1 No test framework.** Vitest installed and scripted; the first test files are still to write — scoring, fuzzy-match, quiz-validate, sanitize, room-store.
- [ ] **10.2 `noUncheckedIndexedAccess` is off** despite constant array indexing; an out-of-range index caused a real bug today.
- [ ] **10.4 No formatter configured.**
- [ ] **10.5 32 lint warnings never fail CI.** Ratchet with `--max-warnings`, promote `exhaustive-deps` to error.
- [ ] **10.8 No pre-commit hook** — CI is the only backstop, minutes away instead of seconds.
- [ ] **10.9 CI has no post-deploy health check.** A green tick only means SSH returned 0.
- [ ] **10.10 No rollback path.** A bad deploy needs manual SSH.

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
