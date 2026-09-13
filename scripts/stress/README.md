# Stress tests

**Localhost only.** Pointing these at production would be a denial-of-service
against your own live service.

```bash
npm run build && npm start -- -p 3005
BASE=http://localhost:3005 PLAYERS=50 node scripts/stress/stress.mjs
BASE=http://localhost:3005 node scripts/stress/getpoll.mjs
BASE=http://localhost:3005 node scripts/stress/abuse.mjs
BASE=http://localhost:3005 node scripts/stress/readygate.mjs
BASE=http://localhost:3005 node scripts/stress/scaleround.mjs
BASE=http://localhost:3005 node scripts/stress/scalemodes.mjs
BASE=http://localhost:3005 node scripts/stress/gametypes.mjs
```

- `stress.mjs` — a full quiz night at once: a room, every player joining
  together, an SSE stream held open per player, everyone answering in the same
  instant. Reports p50/p95/max and failures per phase.
- `getpoll.mjs` — 50 players polling room state from one IP, which is what a
  group on shared Wi-Fi actually does.
- `fullgame.mjs` — **the important one.** A whole quiz night: every player
  joined, a stream held open per player, everyone answering each question in the
  same instant, emoji flying, two players dropping and reconnecting mid-game,
  a wager round, and the host driving the rounds. Reports problems found, not
  just timings.
- `edge.mjs` — the things people actually do: two players typing the same name,
  someone taking another's seat, a player trying to drive the game, a double tap
  on an answer, a late arrival, a lowercase code, a pasted 500-character name.
  Asserts each is handled, rather than measuring anything.
- `hostcrash.mjs` — the host refreshes or their laptop sleeps mid-game with 20
  people playing. Checks the host recovers, that a host action without a token
  is refused, that `isHost` does not leak, that players can keep answering
  while the host is away, and that the game can still be driven to the end.
- `readygate.mjs` — the ready-gate when the room changes shape underneath it:
  six of seven ready and the seventh leaves, one of four leaving mid-count, a
  room everybody leaves, and the ordinary everybody-taps path. Asserts the room
  advances (or deliberately does not) in each.
- `scaleround.mjs` — a whole scale room: created with no quiz selected, the
  creature pair reaching the players while the answer stays on the server, a
  guess scored in log space, a wild guess scoring zero, and the guess row,
  result row and leaderboard all reporting the same number.
- `scalemodes.mjs` — scale rounds under team mode and elimination, which the type system allowed
  and nobody had played, plus a check that the fastest-answer bonus reaches the leaderboard and not
  only the player's own row.
- `gametypes.mjs` — does a room honour the game type the host picked? It did not: the chips were
  inert in multiplayer and every question came through as authored. Plays a room per type and
  reports what was served.
- `abuse.mjs` — one player opening 25 streams. Must still be cut off; this is
  what proves a rate-limit fix made the limit *precise* rather than absent.

## Why these exist

They found two rate limits that made the product's core case impossible.
Everyone in a quiz room is on the same Wi-Fi and therefore one public IP, and a
room holds 50 players, but SSE allowed 30 connections per IP per minute and the
room-state poll allowed 30 per 10 seconds. Fifty players from one IP got fifty
429s on SSE and twenty rejections on the poll.

**When changing any per-IP limit, run these.** A limit that looks generous for
one user is not generous for fifty of them behind one router.

## Measured on a MacBook, production build

A full 10-question game, zero problems at every size:

| players | answer p50 | answer p95 | host `next` p95 |
|---|---|---|---|
| 20 | 7ms | 12ms | 1ms |
| 35 | 12ms | 21ms | 1ms |
| 50 (room cap) | 20ms | 33ms | 1ms |

Memory plateaued: 131MB to 159MB across three full cycles, flat afterwards.
Rooms are retained on purpose (2h idle TTL, 12h hard TTL).

## Run them one at a time

The per-IP ceiling is a 10-second window, so three runs back to back share it.
Chaining 20, 35 and 50 made the 50-player run look like a host lockup that did
not exist — it passed cleanly with 15 seconds between runs. **Wait out the
window before concluding anything.**
