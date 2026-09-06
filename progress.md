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

**Tint** (`/tint`) — a character's palette is scrambled by hue rotation,
saturation scale and lightness offset; three sliders apply the *same* transform,
so an exact undo always exists. Closeness is the mean ΔE₀₀ across all four
palette slots, and the reveal names the worst slot.

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
