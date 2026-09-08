/**
 * Multiplayer stress test. LOCALHOST ONLY — never point this at production.
 *
 * Covers what a real quiz night does to the server at once: a room created,
 * every player joining together, an SSE stream held open per player for the
 * whole game, and everyone answering the same question in the same instant.
 */
const BASE = process.env.BASE ?? "http://localhost:3005";
const PLAYERS = Number(process.env.PLAYERS ?? 50);

const post = async (body) => {
  const t0 = performance.now();
  const r = await fetch(`${BASE}/api/rooms`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const ms = performance.now() - t0;
  let json = null; try { json = await r.json(); } catch {}
  return { status: r.status, ms, json };
};

const pct = (arr, p) => { const s=[...arr].sort((a,b)=>a-b); return s.length ? Math.round(s[Math.floor((s.length-1)*p)]) : 0; };
const summary = (name, times, fails) => {
  console.log(`  ${name.padEnd(26)} n=${String(times.length).padStart(4)}  ` +
    `p50=${String(pct(times,.5)).padStart(4)}ms  p95=${String(pct(times,.95)).padStart(5)}ms  ` +
    `max=${String(pct(times,1)).padStart(5)}ms  failures=${fails}`);
};

console.log(`\nStress: ${PLAYERS} players against ${BASE}\n`);

// --- 1. create a room ------------------------------------------------------
const quizzes = await (await fetch(`${BASE}/api/quizzes`)).json();
const quizId = (Array.isArray(quizzes) ? quizzes : quizzes.quizzes)?.[0]?.id;
if (!quizId) { console.error("no quizzes available"); process.exit(1); }
const hostId = `host-${Date.now()}`;
const created = await post({ action: "create", hostId, quizIds: [quizId], questionCount: 10 });
if (created.status !== 200) { console.error("create failed", created.status, created.json); process.exit(1); }
const { code, hostToken } = created.json;
console.log(`  room ${code} created in ${Math.round(created.ms)}ms (quiz: ${quizId})\n`);

// --- 2. all players join at once ------------------------------------------
const joinTimes = [], players = [];
let joinFails = 0, rateLimited = 0;
const joins = await Promise.all(
  Array.from({ length: PLAYERS }, (_, i) =>
    post({ action: "join", code, playerId: `p${i}`, name: `Player${i}`, emoji: "d2:1:2:3:4:-1:-1:-1:5:0:0" })
  )
);
joins.forEach((r, i) => {
  joinTimes.push(r.ms);
  if (r.status === 200) players.push({ id: `p${i}`, token: r.json.playerToken });
  else { joinFails++; if (r.status === 429) rateLimited++; }
});
summary("join (concurrent)", joinTimes, joinFails);
console.log(`  joined=${players.length}  rate-limited=${rateLimited}\n`);

// --- 3. an SSE stream per player, held open -------------------------------
const controllers = [], sseOpen = [], sseStatus = {};
let sseFails = 0;
await Promise.all(players.map(async (p) => {
  const ac = new AbortController(); controllers.push(ac);
  const t0 = performance.now();
  try {
    const r = await fetch(`${BASE}/api/rooms/${code}/stream?playerId=${p.id}&token=${encodeURIComponent(p.token)}`, { signal: ac.signal });
    if (!r.ok) { sseFails++; sseStatus[r.status] = (sseStatus[r.status]||0)+1; return; }
    sseOpen.push(performance.now() - t0);
    r.body.getReader().read().catch(() => {});   // hold it open
  } catch { sseFails++; }
}));
summary("SSE connect", sseOpen, sseFails);
console.log(`  SSE failure statuses: ${JSON.stringify(sseStatus)}`);

// --- 4. start, then everyone answers simultaneously -----------------------
const started = await post({ action: "start", code, hostId, hostToken });
console.log(`\n  start: ${started.status} in ${Math.round(started.ms)}ms`);

const answerTimes = []; let answerFails = 0;
const answers = await Promise.all(players.map((p) =>
  post({ action: "answer", code, playerId: p.id, token: p.token, answerIndex: Math.floor(Math.random()*4) })
));
answers.forEach(r => { answerTimes.push(r.ms); if (r.status !== 200) answerFails++; });
summary("answer (simultaneous)", answerTimes, answerFails);

// --- 5. does the 50-player cap hold? --------------------------------------
const overflow = await post({ action: "join", code, playerId: "overflow", name: "Overflow", emoji: "d2:1:1:1:1:-1:-1:-1:1:0:0" });
console.log(`\n  51st join -> ${overflow.status} ${JSON.stringify(overflow.json?.error ?? overflow.json)}`);

// --- 6. is the POST rate limit real? (240 / 10s) -------------------------
let limited = 0, ok = 0;
const burst = await Promise.all(Array.from({ length: 320 }, () =>
  post({ action: "answer", code, playerId: players[0].id, token: players[0].token, answerIndex: 0 })
));
burst.forEach(r => r.status === 429 ? limited++ : ok++);
console.log(`  burst of 320 POSTs -> ${ok} passed, ${limited} rate-limited (429)`);

controllers.forEach(c => c.abort());
console.log("\n  done\n");
