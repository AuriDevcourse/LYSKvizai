// The fix must still stop a reconnect loop. One verified player opening streams
// over and over should be cut off, while fifty distinct players are not.
const BASE = process.env.BASE ?? "http://localhost:3005";
const q = await (await fetch(`${BASE}/api/quizzes`)).json();
const quizId = (Array.isArray(q) ? q : q.quizzes)[0].id;
const c = await (await fetch(`${BASE}/api/rooms`, { method:"POST", headers:{"content-type":"application/json"},
  body: JSON.stringify({ action:"create", hostId:`h${Date.now()}`, quizIds:[quizId], questionCount:5 })})).json();
const j = await (await fetch(`${BASE}/api/rooms`, { method:"POST", headers:{"content-type":"application/json"},
  body: JSON.stringify({ action:"join", code:c.code, playerId:"abuser", name:"Abuser", emoji:"d2:1:1:1:1:-1:-1:-1:1:0:0" })})).json();

const tally = {};
const acs = [];
for (let i = 0; i < 25; i++) {
  const ac = new AbortController(); acs.push(ac);
  const r = await fetch(`${BASE}/api/rooms/${c.code}/stream?playerId=abuser&token=${encodeURIComponent(j.playerToken)}`, { signal: ac.signal });
  tally[r.status] = (tally[r.status]||0)+1;
  if (r.ok) r.body.getReader().read().catch(()=>{});
}
acs.forEach(a=>a.abort());
console.log(`  one player opening 25 streams -> ${JSON.stringify(tally)}`);
console.log(`  (expected: ~10 x 200 then 429s — the loop is still caught)`);
