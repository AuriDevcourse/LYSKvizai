// 50 players in one room checking room state at once, all from one IP —
// exactly what happens when a group on shared Wi-Fi opens the join screen.
const BASE = process.env.BASE ?? "http://localhost:3005";
const q = await (await fetch(`${BASE}/api/quizzes`)).json();
const quizId = (Array.isArray(q) ? q : q.quizzes)[0].id;
const c = await (await fetch(`${BASE}/api/rooms`, { method:"POST",
  headers:{"content-type":"application/json"},
  body: JSON.stringify({ action:"create", hostId:`h${Date.now()}`, quizIds:[quizId], questionCount:5 })})).json();

const res = await Promise.all(Array.from({length:50}, () =>
  fetch(`${BASE}/api/rooms?code=${c.code}`).then(r => r.status)));
const tally = {};
res.forEach(s => tally[s] = (tally[s]||0)+1);
console.log(`  50 concurrent GET /api/rooms from one IP -> ${JSON.stringify(tally)}`);
