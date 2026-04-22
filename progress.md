# Quizmo — Progress log

Session-by-session record of what shipped and what's next. Most recent session on top.

**Live:** https://quizmo.auridev.com
**Repo:** https://github.com/AuriDevcourse/LYSKvizai
**Deploy:** push to `master` → GitHub Actions → Hetzner (~60s)

---

## Backlog (pick from here next session)

### 🔴 High — from UI polish audit
- Unify primary CTA (`HostLobby.tsx:120`, `GameModeSelector.tsx:131`, `WagerScreen.tsx:46` use plain `bg-white`; should use `btn-primary`)
- Flatten the body gradient (`globals.css:26` has a muddy orange haze that fights answer buttons; move to flat `#0e0e0e`, keep `.bg-pattern` for home hero only)
- Promote the HostLobby empty state — when no players have joined, make the QR code the hero and hide the disabled Start button; animate Start in when player #1 arrives

### 🟡 Medium — from competitor research (Kahoot-style patterns)
- Answer distribution bar chart after each question — data already computed server-side, pure UI work
- Streak multiplier visible on player phones — `streak` is tracked server-side, just needs a badge
- Wire up the existing `confetti-fall` keyframe on Leaderboard podium reveal
- Kahoot two-screen split: host screen keeps colored shapes, phone shows shapes only (no answer text)
- Ambient lobby audio + countdown sting (needs sourcing)

### 🟡 Medium — from audit + deploy feedback
- Trending-modes chips on home either wire them to actions or remove them (currently decoration)
- Power-up + streak badges cluttering the answer screen — collapse to a single icon that opens a sheet
- PlayerLobby wait screen is empty — show quiz preview / other players breathing
- Mobile tap-targets at 36px — bump exit X, mute, join X to 44px minimum
- Missing `inputMode` / `autoComplete` / `enterKeyHint` on several inputs

### 🟢 Low — nice polish
- QR code copy-link button on HostLobby
- Haptic feedback (`navigator.vibrate(15)`) on answer commit
- Logo stroke color cycle slow from 6s to 10-12s
- Leaderboard rank-change animation
- Post-game review mode (step through each question's results)
- Spinner Wheel feature for tiebreakers / random player callouts

### Ideas to deliberately skip
- Blooket-style collectible characters (content treadmill)
- Gimkit's 13 game modes (team-years of work)
- Quizizz memes (off-brand for Electric Glass)
- Self-paced mode (kills the shared live moment)

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
