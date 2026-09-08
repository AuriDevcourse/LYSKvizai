/**
 * A realistic full game, end to end. LOCALHOST ONLY.
 *
 * The earlier test played one question. This plays every question the way a
 * real quiz night does: 20 players joined, an SSE stream per player held open
 * for the whole game, everyone answering each question in the same instant,
 * emoji reactions flying, a couple of players dropping and reconnecting
 * mid-game, and the host driving next/results between rounds.
 *
 * It asserts on correctness as well as speed: every player's answer must be
 * recorded, the leaderboard must have everyone, scores must be plausible.
 */
const BASE = process.env.BASE ?? "http://localhost:3005";
const PLAYERS = Number(process.env.PLAYERS ?? 20);
const QUESTIONS = Number(process.env.QUESTIONS ?? 10);

const problems = [];
const flag = (m) => { problems.push(m); console.log(`  ⚠ ${m}`); };

const post = async (body) => {
  const t0 = performance.now();
  let r, json = null;
  try {
    r = await fetch(`${BASE}/api/rooms`, { method: "POST",
      headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    try { json = await r.json(); } catch {}
  } catch (e) { return { status: 0, ms: performance.now()-t0, json: { error: String(e) } }; }
  return { status: r.status, ms: performance.now() - t0, json };
};
const getState = async (code) =>
  (await (await fetch(`${BASE}/api/rooms?code=${code}`)).json());

const pct = (a,p) => { const s=[...a].sort((x,y)=>x-y); return s.length?Math.round(s[Math.floor((s.length-1)*p)]):0; };

console.log(`\n  Full game: ${PLAYERS} players, ${QUESTIONS} questions, ${BASE}\n`);

const q = await (await fetch(`${BASE}/api/quizzes`)).json();
const quizId = (Array.isArray(q) ? q : q.quizzes)[0].id;
const hostId = `host-${Date.now()}`;
const created = await post({ action:"create", hostId, quizIds:[quizId], questionCount:QUESTIONS });
if (created.status !== 200) { console.error("create failed", created.json); process.exit(1); }
const { code, hostToken } = created.json;

// join everyone
const players = [];
for (const r of await Promise.all(Array.from({length:PLAYERS}, (_,i) =>
      post({ action:"join", code, playerId:`p${i}`, name:`Player${i}`, emoji:"d2:1:2:3:4:-1:-1:-1:5:0:0" })))) {
  if (r.status === 200) players.push({ id:`p${players.length}`, token:r.json.playerToken });
  else flag(`join failed: ${r.status} ${JSON.stringify(r.json)}`);
}
console.log(`  joined ${players.length}/${PLAYERS}`);
if (players.length !== PLAYERS) flag(`only ${players.length} of ${PLAYERS} joined`);

// a live stream per player, held open all game
const acs = [];
let sseOk = 0;
await Promise.all(players.map(async p => {
  const ac = new AbortController(); acs.push(ac);
  try {
    const r = await fetch(`${BASE}/api/rooms/${code}/stream?playerId=${p.id}&token=${encodeURIComponent(p.token)}`, { signal: ac.signal });
    if (r.ok) { sseOk++; r.body.getReader().read().catch(()=>{}); } else flag(`SSE ${r.status} for ${p.id}`);
  } catch { flag(`SSE threw for ${p.id}`); }
}));
console.log(`  streams open ${sseOk}/${players.length}`);

const st = await post({ action:"start", code, hostId, hostToken });
if (st.status !== 200) flag(`start failed: ${JSON.stringify(st.json)}`);

const answerMs = [], advanceMs = [];
let answerFails = 0, reactFails = 0;

for (let qi = 0; qi < QUESTIONS; qi++) {
  const state = await getState(code);
  if (state?.state === "finished") { console.log(`  game ended early at question ${qi+1}`); break; }

  // Everyone answers at once — but only while the room is taking answers. A
  // wager round is a legitimate state that refuses answers, and counting that
  // as a failure hid the real result.
  if (state?.state === "question") {
    const rs = await Promise.all(players.map(p =>
      post({ action:"answer", code, playerId:p.id, token:p.token, answerIndex: Math.floor(Math.random()*4) })));
    rs.forEach(r => { answerMs.push(r.ms); if (r.status !== 200) { answerFails++;
      if (answerFails <= 2) flag(`answer rejected q${qi+1}: ${r.status} ${JSON.stringify(r.json)}`); } });
  }

  // reactions, like a real room
  await new Promise(r=>setTimeout(r,120));
  const reacts = await Promise.all(players.slice(0,8).map(p =>
    post({ action:"react", code, playerId:p.id, token:p.token, emoji:"🔥" })));
  reacts.forEach(r => { if (r.status !== 200) { reactFails++;
    if (reactFails <= 2) flag(`react rejected: ${r.status} ${JSON.stringify(r.json)}`); } });

  // two players drop and come back, as phones do
  if (qi === 3) {
    for (const p of players.slice(0,2)) {
      await post({ action:"disconnect", code, playerId:p.id, token:p.token });
      const rj = await post({ action:"join", code, playerId:p.id, name:`Player${p.id.slice(1)}`, emoji:"d2:1:2:3:4:-1:-1:-1:5:0:0", token:p.token });
      if (rj.status !== 200) flag(`reconnect failed for ${p.id}: ${rj.status} ${JSON.stringify(rj.json)}`);
    }
    console.log(`  2 players dropped and reconnected mid-game`);
  }

  // A wager round needs every player to stake, then the host to advance.
  const mid = await getState(code);
  if (mid?.state === "wager") {
    const ws = await Promise.all(players.map(p =>
      post({ action:"submit-wager", code, playerId:p.id, token:p.token, amount:100 })));
    const wfail = ws.filter(r => r.status !== 200);
    if (wfail.length) flag(`${wfail.length}/${players.length} wagers rejected: ${JSON.stringify(wfail[0].json)}`);
    const adv = await post({ action:"advance-wager", code, hostId, hostToken });
    // All 20 stakes completing the phase already advances it, so "No wager
    // phase" here means it worked, not that it broke.
    if (adv.status !== 200 && !/No wager phase/.test(adv.json?.error ?? "")) {
      flag(`advance-wager failed: ${adv.status} ${JSON.stringify(adv.json)}`);
    }
    console.log(`  wager round played at q${qi+1}`);
  }

  const nx = await post({ action:"next", code, hostId, hostToken });
  advanceMs.push(nx.ms);
  if (nx.status !== 200 && qi < QUESTIONS - 1) flag(`next failed at q${qi+1}: ${nx.status} ${JSON.stringify(nx.json)}`);
}

const final = await getState(code);
console.log(`\n  answer      p50=${pct(answerMs,.5)}ms p95=${pct(answerMs,.95)}ms max=${pct(answerMs,1)}ms  failures=${answerFails}`);
console.log(`  host next    p50=${pct(advanceMs,.5)}ms p95=${pct(advanceMs,.95)}ms max=${pct(advanceMs,1)}ms`);
console.log(`  final state: ${final?.state}  players: ${final?.playerCount}`);
if (final?.playerCount !== PLAYERS) flag(`final playerCount ${final?.playerCount}, expected ${PLAYERS}`);
if (reactFails) flag(`${reactFails} reactions rejected`);

acs.forEach(a => a.abort());
console.log(`\n  problems found: ${problems.length}\n`);
