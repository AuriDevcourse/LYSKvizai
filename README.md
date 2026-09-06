# Quizmo

Live multiplayer quiz app. A host puts questions on a big screen; players answer
on their phones. Next.js 16 (App Router) + React 19 + TypeScript, real-time over
SSE, rooms held in memory.

**Live:** https://quizmo.auridev.com

## Docs

Read these before changing anything — they are kept current.

| File | What it holds |
|---|---|
| `CLAUDE.md` | Design system ("Electric Glass") and project conventions. Strict — read it before touching UI. |
| `progress.md` | Changelog, most recent session first, plus the working backlog. |
| `audit.md` | Known problems, severity-ranked, with what's fixed and what's still open. |
| `ideas.md` | Unbuilt ideas, upstream of the backlog. |
| `AREAS.md` / `IMPROVEMENTS.md` | The ten-area split and the improvement list built from it. |

## Local development

```bash
npm ci
cp .env.example .env.local     # fill in EDITOR_SECRET at minimum
npm run dev                    # http://localhost:3000
```

`--hostname 0.0.0.0` is already in the dev script so a phone on the same Wi-Fi
can join a room — the host lobby shows the LAN URL and a QR code.

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build — **must pass before deploy** |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run clean` | Remove `.next` and the TS build cache |
| `npm run qa` | Project-specific QA sweep (`scripts/qa-monitor.sh`) |

If the dev server is mysteriously slow to start, run `npm run clean` first — a
stale `.next` once caused a 210-second cold start.

## Architecture

```
Player phone ──┐                        ┌── in-memory room store
               ├── POST /api/rooms  ────┤   (src/lib/multiplayer/room-store.ts)
Host screen ───┘                        └── broadcast
                                              │
               ◄── GET /api/rooms/[code]/stream  (SSE)
```

- **Rooms** live only in the server process (`room-store.ts`). No database.
- **Quizzes** are JSON files in `data/quizzes/`, read and written through
  `src/lib/quiz-store.ts`, which caches metadata in memory.
- **Auth**: players hold a per-player token issued on join; every mutating
  action verifies it. The editor and upload endpoints require `EDITOR_SECRET`
  as a bearer token and **fail closed in production** if it is unset.

## Deploy

Push to `master` → GitHub Actions (`.github/workflows/deploy.yml`) runs
typecheck + lint + build, then SSHes a restricted deploy key to the Hetzner box,
which runs `/opt/lys-kvizai/deploy.sh` and restarts the `lys-kvizai` systemd
unit.

**Set `EDITOR_SECRET` on the server** (`openssl rand -base64 24`) or the editor
returns 503 there — that is the fail-closed default working as intended.

### Two known gaps before you deploy

1. **Live games die on deploy.** The room store is in memory and the deploy
   restarts the service. Any game in progress is lost.
2. **Quizzes edited on the live site are reverted by the next deploy.** All 54
   quiz files are git-tracked and deploy runs `git reset --hard`.

Both are tracked in `audit.md` (I1, I2). There is no rollback mechanism — a bad
deploy needs a manual SSH and `git checkout <prev-sha>` on the box.
