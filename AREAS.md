# Quizmo — 10 areas

Working split for the improvement pass. Each area gets 10 concrete improvements.

| # | Area | Owns |
|---|------|------|
| 1 | Game engine | `lib/multiplayer/room-store.ts`, `scoring.ts`, `types.ts`, `room-code.ts` |
| 2 | API & security | `app/api/**`, `lib/auth.ts`, `lib/rate-limit.ts`, `lib/sanitize.ts`, validators |
| 3 | Realtime & resilience | `lib/multiplayer/sse-manager.ts`, `app/api/rooms/[code]/stream`, `hooks/useRoom.ts` |
| 4 | Player UI (phone) | `components/multiplayer/Player*`, `JoinForm`, `FastestFinger`, `YearGuesser`, `Wager` |
| 5 | Host UI (big screen) | `components/multiplayer/Host*`, `Leaderboard`, `QRCode`, `GameModeSelector` |
| 6 | Content & editor | `app/editor/**`, `components/editor/**`, `lib/quiz-store.ts`, `data/quizzes` |
| 7 | Design system | `app/globals.css`, `components/ui/**`, `lib/quiz-theme.ts`, `answer-options.ts` |
| 8 | Accessibility | keyboard, screen readers, contrast, focus, motion, touch |
| 9 | Performance | bundle, re-renders, SSE payloads, images, caching |
| 10 | Tooling & DX | tests, CI, scripts, types, config, docs |

Status tracked in `IMPROVEMENTS.md`.
