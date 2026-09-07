# Quizmo — Progress log

Session-by-session record of what shipped and what's next. Most recent session on top.

**Live:** https://quizmo.auridev.com
**Repo:** https://github.com/AuriDevcourse/LYSKvizai
**Deploy:** push to `master` → GitHub Actions → Hetzner (~60s)

---

## Backlog (pick from here next session)

### 🔴 High — decide before the next deploy
- **Set `EDITOR_SECRET` on the Hetzner box** (`openssl rand -base64 24`). Without it
  the editor returns 503 in production — that's the fail-closed default, not a bug.
- **Live quiz edits are reverted by every deploy.** 54 quiz files are git-tracked,
  the live editor writes to that directory, deploy runs `git reset --hard`. Pick one:
  move quiz data out of the repo, or take the editor off prod. See `audit.md` I1.

### 🟡 Medium — from competitor research (Kahoot-style patterns)
- Kahoot two-screen split: host screen keeps colored shapes, phone shows shapes only (no answer text)
- Ambient lobby audio + countdown sting (needs sourcing)

### 🟡 Medium — from audit + deploy feedback
- Trending-modes chips on home either wire them to actions or remove them (currently decoration)
- Power-up + streak badges cluttering the answer screen — collapse to a single icon that opens a sheet
- PlayerLobby wait screen is empty — show quiz preview / other players breathing
- Rooms still die on every deploy (in-memory store + restart). See `ideas.md`.

### 🟢 Low — nice polish
- QR code copy-link button on HostLobby
- Haptic feedback (`navigator.vibrate(15)`) on answer commit
- Logo stroke color cycle slow from 6s to 10-12s
- Leaderboard rank-change animation
- Post-game review mode (step through each question's results)
- Spinner Wheel feature for tiebreakers / random player callouts

### Done 2026-09-06 (was in this backlog)
CTA unification · flat body gradient · HostLobby empty state · answer distribution
chart · streak badge on phones · confetti on the podium · 44px tap targets ·
`inputMode`/`autoComplete`/`enterKeyHint` on inputs.

### Ideas to deliberately skip
- Blooket-style collectible characters (content treadmill)
- Gimkit's 13 game modes (team-years of work)
- Quizizz memes (off-brand for Electric Glass)
- Self-paced mode (kills the shared live moment)

---

## 2026-09-07 (final) — All 100 improvements resolved: 99 done, 1 rejected

Ten of ten areas complete. The remaining four areas landed in this pass.

**API & security (2 → 10).** `GET /api/rooms` handed the **entire snapshot** —
every player's name, the live question, and during results `correctAnswer`
itself — to anyone who guessed a 4-character code (~1.7M, no lockout).
Unauthenticated callers now get `{exists, state, playerCount}`. While in there:
the **host token was being passed in the query string**, so it landed in proxy
logs, browser history and `Referer` — moved to headers. Plus a 256 KB body cap
before `req.json()` (413 verified), rate limit and cache on the answer-key
endpoint, 404 instead of 403 for a reaped room, security headers, and
`logServerError` on the failures that were genuinely hidden — including an
unreadable quiz file, which used to make a quiz silently vanish from every list.

**Realtime (5 → 10).** `broadcast` pruned dead connections without telling the
room store, so the grace timer waited for the next heartbeat — up to 15 seconds
in which the departed player still counted toward `totalEligible` and the whole
room sat waiting on them. Reconnection no longer gives up permanently (it fell
silent after 3 minutes with nothing to reschedule it). `EventSource` exposes no
status code, so a reaped room and a dropped packet were indistinguishable — one
cheap probe now tells the player "This game has ended." A missed `timer-reduced`
left reconnecting players seconds behind the room and then refused their answer;
the snapshot carries the reduction now.

**Content & editor (1 → 10).** **6.2 and 6.3 were the same broken feature**:
`TOPICS` is a hand-maintained id list, so anything the editor created — and
everything the news cron generated — had an id no topic claimed and was
unselectable. You could build a quiz and never find it to play. Topics now match
by prefix, with a catch-all for the rest. Plus duplicate, search, an
unsaved-changes guard, a real selected state on the type picker (both states
were `bg-white/5`), validation for the two types that could be saved unplayable,
the dead `emoji` field removed end to end, and a **timing preview** with a scrub
slider — because progressive reveal and zoom crops depend entirely on where the
clock is.

**Design system (5 → 10).** 256 arbitrary colour utilities converted to `@theme`
tokens across 42 files: **613 hex literals across 58 files → 371 across 28**.
What remains is data — flag specs, avatar palettes, creature art — where a hex
is a fact, not a design choice. A documented radius scale, one glass recipe, and
the competing hover systems on the answer buttons resolved in favour of the one
that respects `prefers-reduced-motion`.

**Tooling (3 → 10).** **130 tests across 9 files**, up from zero this morning,
now covering `scoring`, `fuzzy-match`, `sanitize` and `quiz-validate`. Five
stricter TS flags on (all measured at zero cost first); `noUncheckedIndexedAccess`
left off with its **163-error** price recorded in `tsconfig.json` so the next
person inherits the number rather than the question. Prettier configured but
deliberately not run. A lint ratchet at 16 warnings (32 at the start of the day).
A pre-commit hook that also blocks iCloud's `" 2"` conflict copies. CI now runs
the tests and **polls the live site after deploying** — a green tick used to mean
only that `ssh` returned 0. Rollback documented as revert-and-push, with an
explanation of why SSH `git checkout` silently undoes itself.

### Two findings from writing the tests

**A single letter won any two-letter typed answer.** `isWithinDistance` floored
the allowed edit distance at 1 regardless of word length, so on a two-character
answer *any* single character matched — a fastest-finger question accepting "Au"
was won by typing "a", and a player could spam vowels against the clock. Fixed,
and guarded by a generated regression test over all 18 accepted-answer sets in
the real data, proving no legitimate match was lost.

**All 30 external quiz images are dead.** Found because the new preview rendered
a blank frame. Checked every one: 0 of 30 return 200. Wikimedia moved thumbnails
to `thumb.wikimedia.org` *and* stopped allowing arbitrary widths — the same file
at 800px is a 400 while 960px on the new host is a 200. So each URL needs a
lookup through the Commons API, not a host rewrite. **`zoom-out-pictures` is
entirely affected — all 15 questions** — which makes that quiz unplayable as
intended. Not caused by the optimizer change; the plain `<img>` tags fail
identically. Left open as a content decision: the durable fix is to download the
30 images and stop depending on a host that has now changed its scheme twice.

### The one rejection

**9.9** — removing the single-language i18n layer. Measured 11.2 KB raw, **3.2 KB
gzipped**, against editing 237 `t(...)` call sites across 31 files. Bad trade,
and recorded as a decision with the numbers rather than left looking forgotten.

Gates: typecheck clean, eslint 0 errors / 16 warnings, **130 tests**, build
clean, pre-commit hook passing.

---

## 2026-09-07 (last) — Game engine: 10/10. Tracker at 68/100

Area 1 was 4/10 and held the only remaining *correctness* bugs in live scoring.
Five areas are now complete.

**The scoring one (1.3).** `getResultsPayload` looked like a getter and paid out
points: it awarded the fastest-answerer bonus as a side effect. `getRoomSnapshot`
calls `room.cachedResults ?? getResultsPayload(room)`, so **a player opening a
stream while that cache happened to be empty would have re-awarded the bonus
just by connecting.** Only the cache-is-never-null invariant stood between that
and a wrong leaderboard. The payout is now `applyFastestBonus`, called once from
`showResults`. Verified programmatically that zero score writes remain inside
`getResultsPayload`, and live that the fastest of three correct answerers still
gets exactly one 150 bonus.

**Elimination ties (1.8).** `sort((a,b) => a.score - b.score)[0]` — `Array.sort`
is stable and the player list is in join order, so a tie removed the same person
every single time. After a couple of rounds that isn't chance, it's a rule
nobody agreed to. New `lowestScorers()` returns the tied group; the caller picks
at random. 5 tests, including negative scores, since slow penalties can go below
zero.

**Freeze (1.6).** A second Freeze in a round was charged, recorded, and reported
as "Froze the timer!" while changing nothing. Now refused before the use is
deducted, with a reason the player can act on.

**And a family of silent failures found while fixing Freeze.** The client never
checked the response on `choose-powerup` — and it turned out `answer-year`,
`answer-text`, `advance-wager` and `force-results` didn't either. All were
`await fetch(...)` in a try/catch with no `res.ok`, and `fetch` resolves on a
400, so every refusal was invisible. **This also means improvement 4.9 was only
half-fixed**: I had made the multiple-choice path report refusals but left the
year and fastest-finger paths swallowing them. All five now go through one
`postAction` helper that surfaces the server's own message.

**Plus:** one `maxWagerFor()` shared by client and server (the formula was
written twice, and the payload shipped a placeholder `maxWager: 0` nobody read);
`FASTEST_BONUS` and `POWER_UP_USES` as constants, where `150` had appeared three
times — once as the value awarded and once as the value *reported*, exactly the
drift that made 1.3 possible; and the dead `mysteryMultiplier` removed from the
room, the payload and both components, with the type checker pointing at the two
unreachable UI branches.

Tests: 63 → **72**, all in `lib/multiplayer`, which had none before this session.

Gates: typecheck clean, eslint 0 errors / 24 warnings, 72 tests, build clean.

---

## 2026-09-07 (latest) — Accessibility: 10/10. Tracker at 62/100

Area 8 was at 1/10. All nine remaining items are done and verified in a live
game — four areas are now complete.

**Contrast (8.4).** Recomputed white-on-`#0e0e0e` and confirmed the tracker's
figures exactly: `/30` is 2.63:1 and `/40` is 3.79:1, both failing AA. Raised
across **91 occurrences** — `/30` → `/45` (**4.50:1**) and `/40` → `/50`
(**5.30:1**). That included 16 `placeholder:` uses; placeholder text conveys
the expected format, so it went up too, accepting that placeholders now sit
closer in weight to real input.

**Announcements (8.2).** One polite `LiveRegion`, not several — concurrent live
regions interrupt each other and the result is worse than silence. It speaks
connection loss, eliminations, players leaving, the answer count, results and
game over, in that order of urgency. Written straight to the node rather than
through state, since a live region is a platform API; and an alternating
zero-width space is appended so the *same* message twice in a row still gets
spoken, which is otherwise a silent no-op.

**The countdown (8.3).** A 10Hz clock must never sit in a live region — it
would talk over the question. The digits are `role="timer"` with the value
`aria-hidden`, the bar is `aria-hidden`, and the time is spoken only at the
moments that change a decision: 30, 10, 5, 3 and zero, each exactly once.
Verified on a 12-second clock: "5 seconds left." → "3 seconds left." → "Time is
up."

**Keyboard play (8.8).** Number keys 1-4 answer, bound to the document so
nothing needs focusing first, ignored while a text field has focus, and matched
on `e.code` so they work on layouts where the unshifted key isn't a digit.
Verified live: pressing `2` locked the answer in.

**Titles (8.6).** Every page here is a client component and therefore cannot
export `metadata`, so each route got a thin layout that carries it, plus a
`title.template` in the root. `/play/[code]` puts the **room code** in the tab —
hosts routinely have the big screen and their own phone open and both said
"Quizmo". One known gap: the intermediate `/play` layout stops the root template
reaching `/play/[code]`, so that one reads "Room E7LC" rather than
"Room E7LC · Quizmo". Left as is; the code is the useful half.

**Also:** the wager slider got a name and `aria-valuetext` with units (a bare
"450" says nothing about what is being staked); join errors are now
`role="alert"` and tied to the room-code field with `aria-invalid` /
`aria-describedby`; and the leaderboard's rest-of-field is a real `<ol>` with
`start` continuing from the podium, so it reads as a ranking with a length and a
position rather than a stream of names.

**8.5 is an honest partial.** `alt=""` told screen readers the question image
was decorative, which is wrong — on a picture round the image *is* the
question. But describing the contents answers it: "a photo of the Eiffel Tower"
gives away "which landmark is this?". So the alt names the image's **role** and
not its contents, which is the case WCAG 1.1.1 carves out for tests. It lets a
blind player know to ask rather than silently lose the round; it does not make
picture rounds playable without sight.

Gates: typecheck clean, eslint 0 errors / 24 warnings, 63 tests, build clean.

---

## 2026-09-07 (final) — Performance: 9/10, one rejected. Tracker at 53/100

Performance was the only area untouched at 0/10. Everything below was measured
on a **production build**, not guessed at.

**The two biggest wins weren't where the tracker said.**

1. **The lobby's 5.3 MB MP3 (9.7).** `useSound` built an `Audio` for every
   sound on mount with `preload="auto"`, so the file downloaded the instant the
   host lobby rendered — and the lobby starts *muted*, so the normal session
   paid 5.3 MB over venue wifi for music it never played, while that same
   connection served the join page to thirty phones. Nothing is constructed at
   mount now. Verified on a real host lobby: no audio fetched, and `load()`
   still reaches `readyState 4`.

2. **192 KB of fonts — a third of the page weight, and not on the list at all.**
   **Geist** was downloaded on every page and applied to nothing: `--font-sans`
   was defined and never used, and `--font-mono` pointed at a font that was
   never imported, so the `font-mono` hex codes in the Tint game weren't
   actually monospace. Plus Jakarta Sans shipped five static weights where a
   variable font covers the range. Be Vietnam Pro loaded `300`, which appears
   nowhere, and did **not** load `800` or `900`, which 150 places ask for — the
   browser had been synthesising both. Now **192 KB → 166 KB**, with two
   weights that rendered fake now rendering real. `latin-ext` deliberately
   kept: player names are free text and Bačiauskas needs the č.

**The rest**
- **9.1** — the avatar engine is deferred with `next/dynamic`. **`/play` initial
  JS 943 KB → 645 KB.** The item's ~300 KB figure was right after all; my first
  reading of it was wrong because I compared compressed bytes to its
  uncompressed ones.
- **9.2** — all question pictures go through the optimizer now.
  `redwood.jpg` **294 KB → 83 KB** at the size a phone needs.
- **9.4** — a power-up tap sent the *entire room snapshot* to everyone; it now
  sends a `power-up-used` event with just the delta.
- **9.5 / 9.6** — `useCountdown` fires `setState` at 10Hz, so the whole
  projected screen and every phone's question screen were rebuilt ten times a
  second. The ticking now lives in `TimerBar`, `TimerCircle` and
  `ZoomOutImage` leaves. `PlayerQuestion` was the worse of the two: it ticked
  on *every* question type for a zoom value only zoom-out questions read.
- **9.8** — dropped the `en` envelope duplicating `correctAnswerText` and
  `explanation`. Found in passing that **`QuestionPayload.en` was never
  populated by the server**, so 8 call sites were reading a field that never
  existed.
- **9.10 + 2.4** — a `headers()` block: a year of `immutable` for `public/`
  assets (`no-cache` for the Tint manifest, which is edited in place), plus
  `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` and HSTS. No CSP: this
  app leans on inline styles and a real policy needs building and testing, not
  guessing. Both verified with `curl -I`.
- **9.3** — resolved by inverting the premise. The count was broadcast to
  everyone and only the host rendered it; improvement 4.1 now shows it on the
  players' waiting screen, so every recipient uses it.
- **9.9 — rejected, with the numbers.** 11.2 KB raw, **3.2 KB gzipped**, versus
  editing 237 `t(...)` call sites across 31 files. Bad trade. Revisit if a
  second language ever returns.

**One regression I caused and caught.** `QuizImage` first used `fill`, which
absolutely positions the image — and every caller wraps these in a shrink-to-fit
box, so those boxes collapsed to **zero width** and the pictures vanished,
leaving a gap on the reveal screen. Found by loading a real image question in
the browser, not by the type checker or the build. Rebuilt with explicit
dimensions so the images stay in normal flow.

Side effect: eslint warnings **32 → 24**, because the `<img>` conversions
retired eight `no-img-element` warnings.

Gates: typecheck clean, eslint 0 errors / 24 warnings, 63 tests, build clean.
Verified live in Chrome: host lobby, question screen (timer counting and
expiring), reveal screen with an optimizer-served image, and the avatar picker
behind its new lazy boundary.

---

## 2026-09-07 (latest) — Areas 4 and 5 finished: 43/100

Player UI and Host UI were both at 1/10. Both are now **10/10**, taking the
tracker from 25 to 43. The theme across nearly all 18 items: the data was
already computed and already on the wire, and nothing rendered it.

**Host (Area 5)**
- **Reveal now** button. `forceShowResults` existed in `room-store.ts`, was
  wired into `POST /api/rooms`, was validated, and the client already called it
  from `handleTimerExpire` — there was simply no manual trigger.
- Answer count shows a denominator: `7/8`, not `7`.
- Team mode names the current answerers on the projected screen
  (`currentTeamAnswerers` was only ever read by the phones).
- Host lobby groups players by team, with a "Not assigned" group — which
  usefully surfaces that teams aren't allocated until the game starts.
- Lobby grid capped at `42vh` with internal scroll and tiles that shrink past
  16 players, so Start can't be pushed off a screen nobody can scroll.
- Team scores moved above the individual leaderboard as large count-up panels.
- Wager phase shows who has locked in, `n/total`, and how many are still
  deciding. Needed a new `hasWagered` **boolean** on `PlayerInfo` — never the
  amount, since a visible wager isn't a wager.
- **Ties now share a place.** `getLeaderboard` ranked by array position, so two
  players on 4200 were shown 2nd and 3rd. New `competitionRanks()` in
  `scoring.ts` with 6 unit tests — the first tests over anything in
  `lib/multiplayer`, which chips at 10.1.

**Player (Area 4)**
- The post-answer wait shows a progress bar and "1 of 3 answered".
- Players see their rank, movement since last round, and score.
- Eliminated players read "Spectating", not "No Answer" — needed a persistent
  `eliminated` prop, since `eliminatedThisRound` only covers the round they
  went out.
- Streak badge added to the fastest-finger and year-guesser screens.
- Haptics on the reveal, including the `error` pattern that had been defined
  and never called.
- Lobby shows mode, question count and your team.
- Answer buttons disable while the stream is down.
- A refused late tap un-commits the choice and says so, instead of showing
  "Locked in" and then turning up as "No Answer".
- The Join button names what's missing.

**A blocking bug found by driving the create flow.** Choosing "All questions"
could never create a room. The client sent a magic `999`, relying on the server
clamping it; the security pass then added `validateAction`, which caps
`questionCount` at 100 — so `999` failed validation and returned
`Invalid questionCount`. Our own hardening broke the feature. Reproduced
directly against `POST /api/rooms` and fixed by sending the real total, capped
at the same limit the server enforces.

**Two corrections to the tracker itself**, both from checking rather than
trusting it: 5.2 claimed `total` was "destructured and never read" (it *was*
read, for `allAnswered` — just never displayed), and 5.8 was already fixed by
the redesign commit `a440431`.

**Environment note.** `~/Documents` is iCloud-synced and this repo lives inside
it, so iCloud keeps creating `" 2"` conflict copies of Next's generated types
under `.next/`. They break `tsc` with duplicate-identifier errors and
regenerate within minutes of being deleted. Worth excluding the repo from
sync — this is the second stale-artifact confusion this week.

Gates: typecheck clean, eslint 0 errors (32 warnings, unchanged), 63 tests,
build clean. Verified in a live team game and a live classic game in Chrome.

---

## 2026-09-07 (newest) — `/library`: browse every question and asset

New read-only page at **`/library`**, linked from a Library button in `/editor`.
Two tabs.

**Questions** — all 771, flattened out of the 54 quiz files.
- Search across question text, all four options, the explanation and the quiz name.
- Filter by quiz (dropdown) and by type (chips with live counts: 594 standard,
  78 year-guesser, 77 bluff, 15 zoom-out, 4 true/false, 3 fastest-finger).
- Correct answer highlighted; an Answers toggle hides them for screen-sharing.
- Renders 40 at a time with a "show more", so 771 cards never hit the DOM at once.
- Each card links to its quiz in the editor.

**Assets** — 121 files across four folders, with who references what.
- Folder cards double as filters: quiz-images (29), sounds (3), avatars (87),
  tint-local (2), each with its size and what it's for.
- Image thumbnails, working audio players.
- Every file says who uses it: which questions, or which source file.
- "Unused only" (19) finds genuinely orphaned files.
- Flags questions pointing at files that aren't on disk (currently 0) and lists
  the 30 references that load from another domain.

### Getting "unused" right took three passes
The naive answer — no question names it — was wrong twice:
1. It reported **87 unused avatars**. Avatars are chosen by players and resolved
   as `/avatars/${file}` in `Avatar.tsx`; no question ever names one. Fixed with
   a per-folder `AssetUsage`, where `code` means paths are built at runtime and
   so can't be judged from here at all.
2. It still reported the **lobby music** as unused, because `sounds` *is* a
   question-referenced folder — but that one file is played from
   `src/hooks/useSound.ts`. Fixed by also scanning the source tree for literal
   asset paths. `Correct Answer.mp3` and `Wrong.wav` really are unreferenced.
3. That scan then counted **its own documentation**: a comment in
   `library-types.ts` quoted the music's path, so the file appeared to use
   itself. The comment now says so and warns the next editor.

### Two bugs the library exposed in the data
- 81 questions carry `options: ["","","",""]` and `correct: 0` as filler —
  78 year-guesser and 3 fastest-finger, which aren't multiple choice at all.
  Rendering the grid drew four blank pills with a tick on the first, reading as
  "the answer is blank". Those types now show the year or the accepted answers
  instead. (This is the same set of 81 the save-validation used to drop.)
- 17 of 29 quiz images and 2 of 3 sounds are referenced by nothing.

### Notes
- **No auth, deliberately.** `GET /api/quizzes/[id]` is already public because
  players need it, so every question and answer here is reachable without the
  library; it adds no exposure and saves 54 round trips. Nothing here writes, so
  it needs no `EDITOR_SECRET` — which matters, since `checkEditorAuth` fails
  closed in production and would otherwise 503 the page.
- The asset route takes **no path parameter**: `ASSET_FOLDERS` is a fixed
  allowlist, so there is no traversal to escape.
- `library-types.ts` is split from `library.ts` because the page imports
  `isOrphan` as a value, and `library.ts` imports `fs` — the first version 500'd
  for exactly that reason.
- Not linked from the player home, matching `/editor`, which is URL-only too.

Gates: typecheck clean, eslint 0 errors (32 warnings, unchanged), 57 tests,
build clean. Verified in Chrome at 1512px and at 500px — no horizontal overflow,
and the mobile BottomNav no longer covers the last card.

---

## 2026-09-07 (last) — Tint is two categories: flags and cartoon characters

Transit lines are **out of the rotation**, at the owner's request. The game now
carries exactly two categories and no third:

- **Flags** — 23 flags, 51 playable regions, each answer a published Pantone /
  RAL / TCX / decree spec.
- **Cartoon characters** — imported by the player, sampled from their own image,
  stored only in their browser.

`transitRound`, the transit `Round` variant, its reveal copy and its renderer
branch are all gone from `src/app/tint/page.tsx`.

`src/lib/games/transit.ts` and `src/components/games/TransitDiagram.tsx` are
**kept but parked**, each with a header saying so. Nothing imports them. They
were removed for scope, not because they were wrong: prompted by a "Mildmay line
what the hell is that?", every one of the 23 lines was checked character by
character against the official Issue 11 PDF — all 11 Underground lines, all six
Overground lines, all six other modes — and every hex and Pantone reference
matched exactly. (The Mildmay line is real: the North London route, Stratford ↔
Richmond/Clapham Junction, named in Nov 2024 after Mildmay Mission Hospital for
its work during the 1980s HIV/AIDS crisis. `PMS 2383`, `#0077ad`.) Reviving the
category means re-adding `transitRound` and nothing else.

**Added one nudge.** With transit gone, a player who has imported nothing sees
only flags, and the `+` in the header is easy to miss — so while the shelf is
empty there's a quiet "Play a cartoon character instead" under the buttons.

Gates: typecheck clean, eslint clean, 57 tests, build clean. Verified in Chrome:
five consecutive rounds were Portugal, Ukraine, Ethiopia, Ireland, France — all
flags, no repeats, no transit.

---

## 2026-09-07 (latest) — Bring your own reference (cartoon characters), and a real hydration bug

**Cartoon characters now work without touching the filesystem.** They already
worked through `public/tint-local/`, but that meant hand-editing a JSON manifest
and sampling a hex in another app. The importer removes both steps.

- `src/lib/games/my-references.ts` — a localStorage store. Images are downscaled
  to a 640px long edge and the whole store is capped at 3.5 MB, well inside a
  typical 5 MB budget. A malformed entry is dropped individually rather than
  taking the store down with it.
- `src/components/games/ReferenceImporter.tsx` — pick an image, **click the
  colour** to sample it from the actual pixels, watch the live mask preview
  (everything unselected desaturates), tune tolerance, name it, save.
- Wired into `/tint`: your own references play first, a `+` in the header opens
  the importer, and a freshly saved reference takes over the current round
  instead of waiting for round 2.

Why localStorage and not the repo: every push to `master` deploys to
quizmo.auridev.com, so copyrighted character art must never enter the tree.
Sampling in the browser keeps the picture on your machine — and the answer is
still measured, not typed, because it comes from the pixels.

**Rotation bookkeeping was a positional index, now it's a played-id set.**
Saving a reference mid-session inserts into the list, and a cursor would then
skip whatever it displaced.

**Fixed a hydration mismatch that predated all of this.** `/tint` and `/scale`
both built their first round in a `useState` initialiser, and every part of that
draws on `Math.random()` — which flag, which region, the scramble, which pair.
The server rendered France, the client rendered Denmark, and React responded by
throwing away and re-rendering the whole tree on every single page load. The
React DevTools badge had been quietly showing "1 Issue" the entire time.

- `/tint` renders no round on the server (`Round | null`) and picks one on mount.
- `/scale` renders a deterministic first pair — `pickPair` now takes an optional
  chooser — and randomises a microtask after mount.
- Checked the other five `useState(() => …)` initialisers: `EmojiReactions`
  only mounts on SSE traffic and the importer's list sits inside a Modal that
  returns `null` while closed, so neither reaches the server's HTML.

Gates: typecheck clean, eslint clean, 57 tests passing, production build passing.
Verified end to end in Chrome: imported an image, sampled its blue, played the
round, scored it against the sampled original (ΔE₀₀ 19.6, +52) and confirmed the
"1 Issue" badge is gone.

---

## 2026-09-07 (later) — Colour game is no longer only flags

Auri asked whether it's only flags. It was — 51 references, all one category,
which made the game one-note. Added a second: **Transport for London line
colours**, 22 more references.

Source is TfL's own "Colour standard", Issue 11 — the document it issues to
suppliers and contractors, which states that "the colours illustrated for each
purpose are mandatory and must be matched accurately". The hex values are the
exact RGB triples printed in that standard with the Pantone reference each
derives from, extracted from the PDF rather than recalled. Covers all 11
Underground lines, the six renamed Overground lines, and DLR / Elizabeth /
Trams / River Services / Cable Car / Coaches.

**73 factual references across two categories.** Rounds alternate, so a session
isn't all of one kind.

The transit round is a stylised route diagram: several lines in their true
colours with one scrambled, mirroring the flag round's "everything else is
correct, so you have real reference points". Deliberately generic rather than a
reproduction of the Tube map — the roundel and the map are TfL trademarks and
the map is a copyrighted work, whereas the colour specifications are published
facts anyone may use.

**Refactor while doing it:** the render layer had a flag branch and an else, and
adding a third category produced type errors immediately. Now one `Subject`
component knows how each category draws itself, called from all four places
that render one. That also fixed the reveal, which was showing only a hex for
non-flag rounds instead of citing the specification.

Six new tests guard the new category the same way: every line cites a Pantone
reference, black is unplayable, ids are unique, every diagram contains its
target exactly once with no duplicates and only companions from the same part of
the network, and every line scrambles reversibly. 57 tests total.

---

## 2026-09-07 — Colour game: 51 factual references, fiction removed

Auri's note: everything must be factual, and "the yellow body" on my test image
was a fictional character with no correct answer. He's right — the game reports
a correct colour and scores you against it, so a reference with no published
value makes the score meaningless. That placeholder is gone and the local
folder's README now says the same thing.

**51 playable colour references across 23 national flags**, every one carrying
the specification it derives from — Pantone, RAL, or a decree (Spain's colours
are named in Royal Decree 441/1981). Researched per flag rather than recalled;
sources are in the commit and the values are cited in-game on the reveal.

Added: Lithuania, Italy, France, Belgium, Ukraine, Norway, Japan, Switzerland,
Greece, Spain, Portugal, Mexico, Kenya, South Africa, Ethiopia — drawn to real
construction geometry, including Greece's canton cross, Portugal's armillary
sphere, South Africa's pall with its gold fimbriation and Ethiopia's pentagram.

Three tests now guard the premise rather than the plumbing: at least 50 playable
references exist, every flag in the data has a renderer (a missing one would
crash mid-round), and every playable colour cites something checkable — a spec
matching Pantone/RAL/TCX/Decree, not the word "white".

`/dev-flags` is an unlinked contact sheet for checking the artwork against the
real flags at a glance. Returns null in production. It earned its place
immediately — Auri spotted that my South Africa was wrong from a game
screenshot, and checking the sheet turned up a second error nobody had noticed:

- **South Africa** was built from hand-written polygons that self-intersected,
  filling the whole area between the pall's arms as solid green. Rebuilt from
  Schedule One of the Constitution (green pall H/5, each fimbriation H/15, red
  and blue bands H/3 — the published 5:1:3:1:5 stack) and drawn with stroked
  polylines instead, so both arms keep a constant width and the centre join
  mitres itself.
- **Jamaica** had its triangles the wrong way round: green at the hoist and fly,
  black top and bottom. It is the reverse. A colour game showing the wrong flag
  is scoring you against the wrong answer, which is worse than looking odd.

51 tests, typecheck, lint and build all clean.

---

## 2026-09-06 (night) — Two solo mini-games: Scale and Tint

Both are single-player, no room, no server state — they slot in beside the quiz
rather than into it.

**Research first, because both games make factual claims.**
- Colour scoring uses **CIEDE2000**, implemented from Sharma, Wu & Dalal (2005)
  and validated in `src/lib/color/ciede2000.test.ts` against all 33 published
  reference pairs to 4 decimal places, plus an independent value from
  python-colormath. Those pairs exist specifically to catch the two classic
  bugs — hue angles straddling the 0/360 seam, and undefined hue at zero chroma
  — so passing them is meaningful rather than decorative.
- Every size in `lib/games/creatures.ts` is a real measurement with its source
  and, crucially, *which* measurement it is recorded next to it. Shoulder height
  and total height are very different numbers for an elephant, and picking the
  wrong one makes the game teach something false.

**Scale** (`/scale`) — a reference creature is drawn at a fixed size with its
real height labelled; you scale a second creature next to it until it looks
right. Scoring is done on the log of the ratio, so 2× too big scores the same as
half too small, and the same ratio scores the same whether the answer is 1 m or
1000 m. A linear score would have called the large-number mistake ten times
worse for no reason.

**Tint** (`/tint`) — one region of a national flag is shown in the wrong colour
while every other region stays correct; three sliders (hue, saturation,
lightness) move that one region, and closeness is ΔE₀₀ against the official
specification.

Auri's call, and it's a better game than what I first built: the mechanic only
works if the player *already knows* the answer, which invented creatures can
never provide. His example was SpongeBob's yellow — right instinct, unusable
source, since Paramount owns him and this app is deployed publicly. Flags give
the identical recall test with none of that risk, and one advantage a cartoon
can't match: the correct answer is a published Pantone or RAL spec rather than
an eyedropper sample of someone's screenshot. The reveal cites it — "Netherlands
specifies the red band as Pantone 186 C".

**Three things the work turned up**
1. A unit test caught that some scrambles were **unwinnable**. HSL clamps at 0
   and 100, so a scramble that pushes a colour against a boundary destroys
   information no slider can recover — while still showing the player a score.
   `randomScramble` now applies its own inverse and measures the round trip,
   damping the lossy axes until it verifies clean. Hue-only is the fallback,
   since rotation never clamps.
2. The scale game was **comparing different quantities**: the blue whale's 30 m
   is a length, not a height, so it rendered smaller than a 3.2 m elephant.
   It's now excluded from that game (it stays in Tint) and every creature
   carries an `artFraction` — the share of its square canvas the measured
   dimension actually spans — so a cat drawn in the lower half of its box no
   longer renders as tall as a giraffe that fills its own.
3. **Every character is drawn from scratch.** That's a legal constraint, not an
   aesthetic one: a "guess the cartoon character" game built on real cartoon
   characters is trademark and copyright infringement. These are original
   archetypes — a knight, a robot, a service droid — which aren't protectable.

Also fixed: Tailwind v4 scans markdown by default, so the design notes quoting
the arbitrary-value font utility as an example of what *not* to write were read
as real class names and emitted invalid CSS that hard-failed `next dev`.
Scanning is now scoped to `src/` with `source(none)`.

**Verified:** 30 unit tests, typecheck, lint (0 errors) and build all clean;
both games played through in the browser.

---

## 2026-09-06 (evening) — Visual redesign

Pushed the visual craft up to the level the product deserves, without abandoning
Electric Glass — this is that language executed properly rather than a new one.

**Atmosphere.** A flat `#0e0e0e` page reads as unstyled dark mode. Three fixed,
pointer-events-none layers mounted once in `layout.tsx` now sit behind and above
every screen: a slow-drifting `.aurora` of orange/blue/magenta light, a
`.vignette` pulling focus to the middle, and generated `.grain` (an inline SVG
turbulence filter — no asset, no request) so large dark areas stop looking like
dead pixels.

**Surfaces.** New `.surface` primitive: gradient hairline border drawn as a
masked pseudo-element, inner specular highlight, real depth shadow. `.surface-hover`
adds a lift and a per-element coloured bloom via `--bloom`. This is what makes a
panel look manufactured rather than drawn.

**The three screens that matter**
- **Home** — oversized `.neon` wordmark (warm bloom, letterforms stay crisp), a
  live-status pill, two doors that bloom in their own colour, and an
  orchestrated `.rise` entrance. The seven "trending mode" chips were decoration
  that looked clickable and did nothing; each one now drops you into the picker
  with that mode selected, which is the fastest route into a game on the page.
- **Host lobby** — room-code tiles are 3D-flipped in on a stagger with an orange
  glow beneath, the QR is framed as a real object, and the composition is one
  centred unit instead of two columns drifting apart.
- **Question / results** — `.answer-btn` gets a lit top edge, a grounded bottom
  edge and a specular sweep on hover; the question card is a `.surface` at
  display scale; the timer dial glows in its state colour with near-black
  numerals. The answer grid claims 38vh instead of 30vh — the middle third of
  the projected screen was dead space.
- **Podium** — first place gets a spotlight cone, a gold-lit plinth and the only
  crown on screen.

**Carried in from the audit while I was in these files**
- The explanation on the reveal screen was the smallest, dimmest text on it
  despite being the payoff (A5.8). Now `text-xl` at 85% opacity.
- The timer dial was white-on-gold/green — poor contrast. Near-black now.
- CLAUDE.md's documented answer palette had drifted from the code (A7.3);
  anyone "correcting" the code from the doc would have reverted the contrast
  fix. It now points at `answer-options.ts` as the single source of truth, and
  documents every new primitive plus the two traps that cost real time today
  (`font-[var(…)]` silently meaning font-weight, and `.tap-target` never setting
  `position`).

Every decorative animation is disabled under `prefers-reduced-motion`.

**Verified:** typecheck, lint (0 errors) and build clean; home, lobby, live
question, reveal and player views all reviewed in the browser at 1512px.

---

## 2026-09-06 (later still) — Ten-area sweep

Split the project into ten areas (`AREAS.md`), ran one analysis agent per area in
parallel, and consolidated 100 improvements into `IMPROVEMENTS.md` with status.
**24 done, 1 partial, 75 open** — every one carries a `file:line` and a concrete
change, so the remaining list is pick-up-and-go work, not a wishlist.

**The five that mattered most**

1. **Saving a year-guesser or fastest-finger quiz silently deleted every
   question** (6.1). Those types are answered by typing, so `QuestionEditor`
   hides the options grid and their `options` stay `["","","",""]` — and the save
   filter required a non-blank option. Measured the blast radius before fixing:
   **6 files, 81 questions**, five of which would have lost all 15.
2. **Answer text failed contrast on its own background** (8.1). White measured
   2.30–2.68:1 — below even the 3:1 large-text floor — on the most-read element
   in the game. Black measures 7.20–8.38:1. Verified independently before
   changing it; it also matches CLAUDE.md's own `btn-primary` rule.
3. **Plus Jakarta Sans never rendered anywhere** (7.1). `font-[var(--font-headline)]`
   compiles to `font-weight: var(--font-headline)` — Tailwind reads a bare
   `font-[…]` as the weight utility. Confirmed in the built CSS that
   `font-family: var(--font-…)` appeared zero times. The font was downloaded on
   every page load and never used.
4. **Two room-wedging engine bugs** (1.1, 1.2). Team mode never auto-advanced on
   typed-answer questions, and the wager phase had no server timer and waited on
   every player including disconnected ones.
5. **`X-Forwarded-For` spoofing defeated every rate limiter** (2.2) — nginx
   appends the real peer, so reading index `[0]` returns the attacker's own
   string. This silently undid the limiters added earlier today.

**Also landed:** SSE stream authenticated, rate limited and capped (2.1/3.4) ·
reconnect restores `connected` (3.2) · jittered backoff (3.6) · 8s action
timeouts (3.7) · `sanitizeText` no longer eats `&` and mis-scores "Fish & Chips"
(2.10) · `.btn-danger` and a shared `:disabled` (7.5/7.10) · README, npm scripts,
Vitest, `.env.example` (10.3/10.6/10.7).

**Three regressions I introduced and caught** — two of them from earlier fixes
in the same session:

- `.tap-target` set `position: relative`, overriding Tailwind's `fixed`; the
  game's exit button became a 1291px bar across the top. Found by driving the
  app in Chrome, not by any automated check.
- Token-gating `disconnect` broke the `pagehide` beacon (3.1). I had reported
  that action as unused — it uses `sendBeacon`, which my grep missed. Every
  clean exit had been falling back to the 120s grace timer.
- Gating `/api/network-url` in production killed the QR code (`undefined/play?…`).
  Only the LAN-enumeration branch should be dev-only.

**Verified:** typecheck, lint (0 errors) and build all clean, plus a full
two-tab game in Chrome — host and player SSE both authenticate, the room updates
live, answers score, and the distribution chart matches.

---

## 2026-09-06 (later) — Simplification pass, verified in a real browser

Drove the whole app in Chrome — create → lobby → 5-question game → podium, plus
the editor — and fixed what that surfaced.

**A regression I'd introduced earlier the same day**
- `.tap-target` set `position: relative`, which overrode Tailwind's `fixed` on
  the game's exit button. It stopped being a 44px circle in the corner and
  became a 1291px-wide bar across the top of every game screen. The utility now
  sets size only, and says why in a comment.

**One palette instead of four**
- The four answer colours were copy-pasted into `HostQuestion`, `HostResults`,
  `PlayerQuestion`, `PlayerResults` — and had drifted. The phone used its own
  darker shades (`#d9534f` vs `#ff716c`), so the answer a player tapped was a
  different colour from the same answer on the host screen. My new distribution
  chart had the array shifted by one entirely, painting a blue answer's bar
  green.
- All of it now comes from `src/lib/answer-options.ts`. The colour *is* the
  answer's identity in this game — people shout "the blue one" across a room —
  so it can't be four half-synchronised copies. Verified on screen: host and
  phone now render identical colours, and the chart matches the answer.

**Fewer controls, same capability**
- The quiz wizard rendered two links both labelled "Back" that went to
  *different* places — one stepped up a level inside TopicPicker, one jumped out
  to the menu. The page-level one now only appears at the picker's root.
- "Pick mode" had a heading, a redundant "Game mode" sublabel, and a Select
  button. Classic has nothing to configure, so it now advances on tap like the
  "How will you play?" screen already did. Elimination and Team still reveal
  their options and confirm — which is the real difference between them.
- Dropped `descKey` from the mode list: defined for all three, rendered nowhere.

**Confirmed working on screen** (not just by API)
- Double pays 2x and says so: +2194 on a 1097 base.
- Wager bonus is included in the reported points — 4742 → 6759, shown as +2,017
  with the 711 wager folded in. That inclusion was exactly what the old
  recompute dropped.
- Streak badge appears at 2 and rides along live during the question (🔥4 on the
  final round).
- Answer distribution chart renders with matching colours and shapes.
- Confetti fires on the winner reveal.
- Start button animates in with player #1; the lobby shows the QR as hero until
  then.
- Editor: delete → glass confirm dialog → server 401 → password prompt, and the
  quiz is still there afterwards. The old native `confirm()` is gone (it also
  used to block browser automation entirely).

---

## 2026-09-06 — Security, scoring and UI pass

Audit first (`audit.md` has the full problem map), then fixed the 🔴 tier.

**Security — the editor API was wide open**
- `POST /api/quizzes`, `PUT`/`DELETE /api/quizzes/[id]` and `POST /api/upload` had
  no auth at all. Anyone who found the domain could rewrite or delete all 54
  quizzes. All four now require `EDITOR_SECRET` via `Authorization: Bearer`
  (`src/lib/auth.ts`), fail closed in production if the var is unset, and are
  rate limited. Player-facing GETs stay public.
- Upload had two more holes: the file extension was taken raw from `file.name`
  (so `a.b/../../../../evil` escaped the upload directory — arbitrary file
  write), and `file.type` was never cross-checked against content (so a `.html`
  declared `image/png` was served as HTML from our own origin — stored XSS with
  access to the tokens in sessionStorage). Extensions are now derived from a
  magic-number sniff, filenames are fully server-generated, and the resolved
  path is asserted to be inside `public/quiz-images`.
- Rate limiting keyed on `body.playerId`, which the client picks — a fresh
  random id bought a fresh window and leaked a Map entry each time. Now keyed on
  IP with the ceiling raised to 240/10s.
- No runtime validation of `/api/rooms` bodies. `answerIndex: 999` turned the
  4-element answer distribution into a 1000-element sparse array broadcast to
  the whole room. Everything is validated in `src/lib/multiplayer/validate.ts`.
- `disconnect` was the one un-gated action; it now needs the player token.
  (Nothing called it — it was pure attack surface.)
- Dependencies: `resend` and `@dicebear/*` were declared but not installed, and
  `tsc` was replaying a stale April `tsconfig.tsbuildinfo` so it never noticed.
  20 npm advisories (10 high, incl. request smuggling in Next 16.1.6) → 1 low,
  via `npm audit fix` + Next 16.3.4.

**Scoring — two code paths were both awarding points**
- Double paid **3x**, not 2x: the multiplier was applied at submit time and a
  second helping added when results were built. Results now reports
  `player.lastPointsAwarded` instead of recomputing.
- Because results recomputed from scratch, the "+points" shown never included
  the double, wager or fastest-finger bonuses — the number on screen didn't
  match the jump in the total. Single source of truth now.
- Fastest-finger graded exactly at submit but fuzzily in results, so a near-miss
  was announced CORRECT and paid nothing. Both use `fuzzyMatch`.
- Text/year answers reuse `currentAnswer` as a 0/-1 flag, which piled every
  correct text answer onto option A of the distribution.

**UI**
- Answer distribution bar chart on host results (the data was already computed
  and thrown away). Needed the distribution fix above to be truthful.
- Live streak badge on the player's phone during the question — the streak drove
  the multiplier but was only visible for a moment afterwards.
- Elimination is finally announced. The server broadcast it, the hook stored it,
  the page destructured it, and nothing rendered it — players were silently
  removed from play. ESLint had been flagging it as an unused variable.
- Confetti on the winner reveal, using the `confetti-fall` keyframe that had
  been sitting unused in globals.css.
- Body gradient flattened to `#0e0e0e` — the old one ran to full orange in the
  corner and fought the answer colours.
- Native `confirm()`/`alert()` in the editor replaced with a glass `Modal` +
  `ConfirmDialog` (focus trap, Escape, scroll lock).
- Remaining white CTAs unified onto `btn-primary`; Start in the host lobby now
  animates in with player #1 instead of sitting there disabled.
- Skeleton loaders replace the bare spinner in the editor list.

**Responsiveness / a11y**
- `prefers-reduced-motion` support — the app was wall-to-wall animation with no
  opt-out.
- Icon buttons 36px → 44px via a `.tap-target` utility; text inputs ≥52px.
- `inputMode` / `autoComplete` / `enterKeyHint` / `aria-label` on every input.
- Visible `:focus-visible` ring (there was no keyboard focus style at all) and
  safe-area insets for the notch.

**Speed**
- `listQuizzes` read and parsed all 54 quiz files on every request. Cached in
  memory, invalidated on write.
- The 210s "cold start" was a stale April `.next` — a clean production build is
  ~35s.

**Ops**
- CI now runs typecheck + lint + build before deploying. It previously went
  straight from `push` to `ssh … deploy` despite CLAUDE.md requiring a passing
  build.
- `.env.example` documents `EDITOR_SECRET`, `RESEND_API_KEY`, `MP_SERVER_URL`.

**Verified**: clean `npm run build`, `tsc --noEmit` and `eslint` all exit 0
(32 warnings, 0 errors, down from 45/1). End-to-end game with 8 players confirms
reported points equal the actual score change every round, and Double measures
exactly 2.00x.

**Not done** — needs your call:
- Quizzes edited on the live site are still reverted by the next deploy
  (`git reset --hard` over 54 tracked files). Needs a decision: move quiz data
  out of the repo, or take the editor off prod.
- `EDITOR_SECRET` must be set on the server before deploying, or the editor
  returns 503 there.

---

## 2026-04-20 — Big session

**Reliability + security**
- Session-token auth: server issues hostToken on create, playerToken on join; every mutating action verifies. Fixes the playerId-broadcast-spoofing and hostId-leak-in-GET vulnerabilities.
- GET `/api/rooms` no longer returns hostId; accepts hostId+hostToken and returns `{ isHost: boolean }`.
- Reconnecting player must present their original token (blocks seat hijack).
- `react` action now token-gated (no outside spammers).
- Freeze power-up now restarts the server-side question timer in sync with the client's visible countdown.
- Team rotation filters disconnected teammates — dropped players don't stall the round.
- `showResults` sets `cachedResults` before flipping state — closes the race where a snapshot fallback could double-apply fastest-finger/double bonuses.

**Deploy + infra**
- Live on Hetzner (systemd service `lys-kvizai`, port 3001) at `https://quizmo.auridev.com`.
- Auto-deploy via GitHub Actions using a restricted SSH deploy key (command="/opt/lys-kvizai/deploy.sh", no shell).
- Let's Encrypt cert auto-renews; nginx `worker_connections 4096`, `LimitNOFILE=65535`.
- `.env.local` on the server (chmod 600, survives `git reset --hard`) holds the Resend API key.

**Features**
- Feedback button (floating bottom-right on every page except active games) → POST /api/feedback → Resend → Auri's Gmail. Rate-limited 5/min/IP.
- Count-up number animation (RAF + ease-out) on results: year-guesser points, per-player points-gained, leaderboard total.
- Player-left toast ("{avatar} {name} left") when someone drops mid-game.
- `createdAt` tracked per quiz, backfilled from git history. TopicPicker shows relative-date suffix and a NEW pill for quizzes added in the last 14 days. Reusable `npm run backfill-dates` script.

**Content + i18n**
- Lithuanian removed end-to-end: renamed 35 quiz files to English slugs, dropped the `lt` block from translations, deleted LanguageToggle + TopNav + `/api/translate` + translate lib + `google-translate-api-x` dep. Kept `useTranslation()` as vestigial English-only helper so the 37 call sites didn't need edits.
- Quiz emojis replaced with Lucide icons: 64-icon curated palette in `src/lib/quiz-icons.ts`, all 54 quizzes backfilled (`npm run backfill-icons` equivalent script at `scripts/backfill-quiz-icons.mjs`), editor now uses a Lucide picker grid, `/api/quizzes` defaults new quizzes to `icon: "BookOpen"`.
- UI chrome emojis stripped (ResultScreen tier badges, charades counter, editor empty/error states, warning banners) → all Lucide icons. Reactions on the game screen (🔥 😂 🎉 etc.) kept — those are user expression.

**Avatars**
- Replaced 16-emoji picker with DiceBear Adventurer (MIT): 45 hair × 26 eyes × 30 mouths × 15 brows, plus optional glasses/earrings/features, 4 skin tones, 14 hair colors.
- AvatarBuilder: 72px preview, "Randomize all" dice, "Re-roll just this" dice, horizontal tabs (Hair / Hair color / Skin / Eyes / Brows / Mouth / Glasses / Earrings / Features / Background).
- Skin is excluded from re-roll and from "Randomize all" (it's identity, not a dice roll).
- Preview + option tiles render square (shape prop) so BG color fills the whole rounded rectangle — no grey padding ring.
- Backward compat for legacy animal/emoji avatars preserved.

**Audits done (reports stored in chat memory)**
- Game-mode audit (room-store, single-player, survival, charades) — found one real bug (team-mode text/year answer validation — fixed), one false alarm.
- Broad audit (logic / security / perf) — found HIGH severity token spoofing issues, all fixed.
- UI polish audit — punch list above in Backlog.
- Competitive research (Kahoot, Gimkit, Blooket, Slido, Mentimeter, Quizizz, etc.) — patterns above in Backlog.
- Avatar library research — picked DiceBear, shipped.

---

## Conventions

- **Commits:** descriptive, explain the why. No auto-commit — always ask.
- **Design:** Electric Glass (dark #0e0e0e, vibrant orange/blue/purple, glass surfaces, minimal text). No emojis in UI chrome — Lucide icons only. User-chosen reactions and avatar emojis are the exceptions.
- **Language:** English everywhere. Lithuanian deliberately removed.
- **Deploy:** every push to master auto-deploys. Test locally first for non-trivial changes (`npm run dev`).
