/**
 * The host refreshes, or their laptop sleeps, mid-game. LOCALHOST ONLY.
 *
 * This is the scariest thing that can happen at a party: twenty people are
 * playing and the person driving reloads the tab. The host identity lives in
 * sessionStorage, so a refresh keeps it — but a *closed* tab or a new tab does
 * not. Both are tested here.
 */
const BASE = process.env.BASE ?? "http://localhost:3005";
const problems = [];
const flag = m => { problems.push(m); console.log(`  ⚠ ${m}`); };
const ok = m => console.log(`  ✓ ${m}`);
const post = async b => { const r = await fetch(`${BASE}/api/rooms`, { method:"POST",
  headers:{"content-type":"application/json"}, body: JSON.stringify(b) });
  let j=null; try { j=await r.json(); } catch {} return { status:r.status, json:j }; };
const state = async code => (await (await fetch(`${BASE}/api/rooms?code=${code}`)).json());

const q = await (await fetch(`${BASE}/api/quizzes`)).json();
const quizId = (Array.isArray(q)?q:q.quizzes)[0].id;

console.log(`\n  Host interruption, 20 players, ${BASE}\n`);

const hostId = `h${Date.now()}`;
const c = await post({ action:"create", hostId, quizIds:[quizId], questionCount:5 });
const { code, hostToken } = c.json;
const players = [];
for (let i=0;i<20;i++) {
  const j = await post({ action:"join", code, playerId:`p${i}`, name:`P${i}`, emoji:"d2:1:2:3:4:-1:-1:-1:5:0:0" });
  if (j.status===200) players.push({ id:`p${i}`, token:j.json.playerToken });
}
console.log(`  ${players.length} players joined room ${code}`);
await post({ action:"start", code, hostId, hostToken });
await Promise.all(players.map(p => post({ action:"answer", code, playerId:p.id, token:p.token, answerIndex:1 })));
ok("question 1 played");

// 1. Host refresh: same hostId + hostToken, as sessionStorage would restore.
{
  const s = await state(code);
  const nx = await post({ action:"next", code, hostId, hostToken });
  if (nx.status !== 200) flag(`host cannot continue after a refresh: ${nx.status} ${nx.json?.error}`);
  else ok(`host resumed after refresh (room still ${s.state}, ${s.playerCount} players)`);
}

// 2. Host opens a NEW tab: same hostId, no token (sessionStorage is per-tab).
{
  const nx = await post({ action:"next", code, hostId, hostToken: undefined });
  console.log(`  · host action with no token -> ${nx.status} ${nx.json?.error ?? "accepted"}`);
  if (nx.status === 200) flag("host action accepted with NO token — anyone with the room code could drive the game");
}

// 3. Can the host recover the room at all from a fresh tab?
{
  const s = await state(code);
  console.log(`  · GET room from a fresh client -> state=${s.state} players=${s.playerCount} isHost=${s.isHost}`);
  if (s.isHost === true) flag("GET reports isHost=true without credentials");
}

// 4. The game must still be playable by the players while the host is away.
{
  const a = await post({ action:"answer", code, playerId:players[0].id, token:players[0].token, answerIndex:0 });
  console.log(`  · player answer while host is away -> ${a.status} ${a.json?.error ?? "accepted"}`);
}

// 5. Does the room survive, and can the host finish the game?
{
  let stuck = false;
  for (let i=0;i<6;i++) {
    const s = await state(code);
    if (s.state === "finished") break;
    if (s.state === "question") {
      await Promise.all(players.map(p => post({ action:"answer", code, playerId:p.id, token:p.token, answerIndex:2 })));
      // `next` is only valid from the results screen, so show them first —
      // which is exactly what the host UI does.
      await post({ action:"force-results", code, hostId, hostToken });
    }
    if (s.state === "wager") {
      await Promise.all(players.map(p => post({ action:"submit-wager", code, playerId:p.id, token:p.token, amount:50 })));
      await post({ action:"advance-wager", code, hostId, hostToken });
      continue;
    }
    const nx = await post({ action:"next", code, hostId, hostToken });
    if (nx.status !== 200 && !/no wager phase|can't continue/i.test(nx.json?.error ?? "")) {
      stuck = true; flag(`host stuck advancing: ${nx.status} ${nx.json?.error}`); break;
    }
  }
  const s = await state(code);
  if (!stuck) ok(`host drove the game to completion (final state: ${s.state}, ${s.playerCount} players)`);
}

console.log(`\n  problems found: ${problems.length}\n`);
