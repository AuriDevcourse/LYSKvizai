# Quizmo — Ideas

Living scratchpad for things we might build. Nothing here is committed work.

`progress.md` holds the **backlog** (polish + fixes we've already decided on). This file is
upstream of that: raw ideas, half-formed. When one gets picked up, move it into the
progress.md backlog with a size and a reason, and delete it here.

Status markers: `?` unexplored · `~` half-designed · `!` we think this is actually important

---

## Infrastructure gaps that will bite us

**! Rooms die on every deploy.** The room store is in-memory and every push to `master`
auto-deploys and restarts the systemd unit. Any live game at that moment is gone. Options,
cheapest first:
- Deploy gate: refuse to restart while `rooms.size > 0`, drain first
- Persist rooms to SQLite on the box (survives restart, no new infra)
- Redis (only worth it if we ever run more than one node)

**? Reconnect UX.** The seat is already held — `DISCONNECT_GRACE_MS` is 120s
(`room-store.ts:48`) and tokens let a phone reclaim it. What's missing is the *player-facing*
half: a "reconnecting…" state instead of a dead screen, and a host-side indicator that
someone is mid-drop rather than gone.

**? Game history.** Nothing is written down after a game ends. A results archive would unlock
"play again with the same crew", host stats, and per-quiz difficulty tuning — but it's the
first thing that needs a real database.

---

## Game modes

**~ Final wager round.** `WagerScreen` already exists. Make it a proper closer: last question,
everyone bets any portion of their points, big swing, leaderboard flips. Cheap because the
mechanic is built — it just needs to be schedulable as the final question.

**? Knockout bracket.** Bottom player drops each round until two remain. Works well with
survival's existing elimination logic.

**? Co-op vs. the clock.** Whole room shares one score bar and one timer. Changes the social
dynamic completely — no losers, good for the awkward-team-event use case.

**? Lightning round.** 10 questions, 5 seconds each, no explanations. Good as a warm-up before
the real quiz while people are still joining.

**? Spectator screen.** A read-only URL for a second display or people watching remotely.
The SSE stream already broadcasts everything needed.

---

## Content pipeline

**! Generate a quiz from a prompt, in the editor.** `scripts/news-quiz-generator.ts` already
does this from the CLI. Putting it behind a button in `/editor` is the single biggest content
unlock — hosts stop needing us to make quizzes for them. Needs: a server route, a cost guard,
and a mandatory human review step before the quiz saves.

**~ CSV / Sheets import.** Most people already have their questions in a spreadsheet. Paste a
Sheets URL or drop a CSV, map columns, done.

**? Fork a quiz.** "Duplicate and edit" on any existing quiz. Trivially cheap, makes the
54-quiz library into a template library.

**? Difficulty auto-tuning.** Once we have game history, flag questions nobody ever gets right
(bad question) and questions everybody gets right (filler).

---

## Host experience

**~ Phone as host remote.** Big screen shows the game; host drives next/skip/pause from their
phone. Currently the host is chained to the laptop running the display.

**? Pause + replay.** Pause mid-question (someone walked in, projector died), and re-ask a
question that got mangled.

**? Pre-flight check.** Before starting: is every question answerable, is any image missing,
how long will this take at current settings. One screen, green ticks.

---

## After the game

**? Shareable result card.** A generated image with the player's avatar, rank, and score,
sized for a phone screenshot. Avatars are already DiceBear SVGs, so this renders server-side
cleanly.

**? Room code that persists.** A recurring group (team standup quiz, family) reusing the same
code every week instead of re-sharing a QR.

---

## Still deliberately skipping

Carried over from progress.md so we don't re-litigate:
collectible characters, a dozen game modes, meme reactions, self-paced mode.

Add to this list when we say no to something — the "no" is worth as much as the idea.
