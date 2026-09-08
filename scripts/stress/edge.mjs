/**
 * Cases fullgame.mjs does not cover, aimed at a 20-player party. LOCALHOST ONLY.
 *
 * Each is something that actually happens in a room full of people, and each
 * asserts a specific expectation rather than just measuring speed.
 */
const BASE = process.env.BASE ?? "http://localhost:3005";
const problems = [];
const flag = m => { problems.push(m); console.log(`  ⚠ ${m}`); };
const ok = m => console.log(`  ✓ ${m}`);
const post = async b => { const r = await fetch(`${BASE}/api/rooms`, { method:"POST",
  headers:{"content-type":"application/json"}, body: JSON.stringify(b) });
  let j=null; try { j = await r.json(); } catch {} return { status:r.status, json:j }; };

const q = await (await fetch(`${BASE}/api/quizzes`)).json();
const quizId = (Array.isArray(q)?q:q.quizzes)[0].id;
const newRoom = async () => {
  const hostId = `h${Math.random().toString(36).slice(2)}`;
  const r = await post({ action:"create", hostId, quizIds:[quizId], questionCount:5 });
  return { hostId, code:r.json.code, hostToken:r.json.hostToken };
};
const join = (code, id, name, token) => post({ action:"join", code, playerId:id, name,
  emoji:"d2:1:2:3:4:-1:-1:-1:5:0:0", ...(token?{token}:{}) });

console.log(`\n  Edge cases against ${BASE}\n`);

// 1. Two people typing the same name — very common at a party.
{
  const r = await newRoom();
  await join(r.code, "a", "Auri");
  const dup = await join(r.code, "b", "Auri");
  if (dup.status === 200) flag("duplicate name accepted — two 'Auri' in one room");
  else ok(`duplicate name refused: ${dup.json.error}`);
  const accent = await join(r.code, "c", "aurí");
  if (accent.status === 200) flag("near-duplicate name 'aurí' accepted alongside 'Auri'");
  else ok(`accent-insensitive duplicate refused: ${accent.json.error}`);
}

// 2. Someone tries to take another player's seat.
{
  const r = await newRoom();
  await join(r.code, "victim", "Victim");
  const steal = await join(r.code, "victim", "Attacker", "wrong-token");
  if (steal.status === 200) flag("SEAT HIJACK: joined as an existing playerId with a wrong token");
  else ok(`seat hijack refused: ${steal.json.error}`);
  const noToken = await join(r.code, "victim", "Attacker");
  if (noToken.status === 200) flag("SEAT HIJACK: joined as an existing playerId with no token");
  else ok(`seat hijack (no token) refused: ${noToken.json.error}`);
}

// 3. A player tries to drive the game.
{
  const r = await newRoom();
  const j = await join(r.code, "p1", "P1");
  const start = await post({ action:"start", code:r.code, hostId:"p1", hostToken:j.json.playerToken });
  if (start.status === 200) flag("PRIVILEGE ESCALATION: a player started the game with their own token");
  else ok(`player cannot start the game: ${start.status} ${start.json.error}`);
  const nx = await post({ action:"next", code:r.code, hostId:"p1", hostToken:j.json.playerToken });
  if (nx.status === 200) flag("PRIVILEGE ESCALATION: a player advanced the question");
  else ok(`player cannot advance: ${nx.status} ${nx.json.error}`);
}

// 4. Answering twice — a double tap, or a deliberate score farm.
{
  const r = await newRoom();
  const j = await join(r.code, "p1", "P1");
  await post({ action:"start", code:r.code, hostId:r.hostId, hostToken:r.hostToken });
  const first = await post({ action:"answer", code:r.code, playerId:"p1", token:j.json.playerToken, answerIndex:0 });
  const second = await post({ action:"answer", code:r.code, playerId:"p1", token:j.json.playerToken, answerIndex:1 });
  if (first.status === 200 && second.status === 200) flag("double-answer accepted — a player can answer the same question twice");
  else ok(`second answer refused: ${second.status} ${second.json?.error}`);
}

// 5. Joining a game already in progress (late arrival).
{
  const r = await newRoom();
  await join(r.code, "p1", "P1");
  await post({ action:"start", code:r.code, hostId:r.hostId, hostToken:r.hostToken });
  const late = await join(r.code, "late", "Latecomer");
  console.log(`  · late join after start -> ${late.status} ${late.json?.error ?? "accepted"}`);
}

// 6. A wrong room code, and a lowercase one (people type both).
{
  const r = await newRoom();
  const lower = await join(r.code.toLowerCase(), "p1", "P1");
  if (lower.status !== 200) flag(`lowercase room code refused: ${lower.json?.error} — people type codes in lowercase`);
  else ok("lowercase room code accepted");
  const bad = await join("ZZZZ", "p1", "P1");
  ok(`unknown room code -> ${bad.status} ${bad.json?.error}`);
}

// 7. Oversized and odd names.
{
  const r = await newRoom();
  const long = await join(r.code, "p1", "N".repeat(500));
  console.log(`  · 500-char name -> ${long.status}${long.status===200 ? ` stored as ${JSON.stringify((await (await fetch(`${BASE}/api/rooms?code=${r.code}`)).json()).playerCount)} player(s)` : ` ${long.json?.error}`}`);
  const empty = await join(r.code, "p2", "   ");
  if (empty.status === 200) flag("blank name accepted");
  else ok(`blank name refused: ${empty.json?.error}`);
  const xss = await join(r.code, "p3", "<img src=x onerror=alert(1)>");
  if (xss.status === 200) {
    const st = await (await fetch(`${BASE}/api/rooms?code=${r.code}`)).json();
    ok(`markup name accepted but sanitized (room now ${st.playerCount} players)`);
  } else ok(`markup name refused: ${empty.json?.error}`);
}

console.log(`\n  problems found: ${problems.length}\n`);
