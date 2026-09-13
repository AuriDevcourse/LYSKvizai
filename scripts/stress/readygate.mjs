/**
 * The ready-gate, when the room stops being the room it was.
 *
 * Played with seven people: six tapped "ready", the seventh closed their tab,
 * and the room never advanced. `readyRequired` excluded the leaver correctly,
 * so the count was six of six, but the only place that compared count to total
 * was `markReady` itself. Nobody was left to tap anything, so nothing ever
 * re-ran the comparison.
 *
 * Each case below leaves a room in a state where the gate is already satisfied
 * and asserts the room moves on by itself. LOCALHOST ONLY.
 */
const BASE = process.env.BASE ?? "http://localhost:3001";
const problems = [];
const flag = (m) => { problems.push(m); console.log(`  x ${m}`); };
const ok = (m) => console.log(`  + ${m}`);

const post = async (b) => {
  const r = await fetch(`${BASE}/api/rooms`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(b),
  });
  let j = null;
  try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};

const stateOf = async (code) =>
  (await (await fetch(`${BASE}/api/rooms?code=${code}`)).json()).state;

const snapshotOf = async (code, hostId, hostToken) =>
  (await (await fetch(`${BASE}/api/rooms?code=${code}`, {
    headers: { "x-host-id": hostId, "x-host-token": hostToken },
  })).json()).snapshot;

/** The gate is re-evaluated synchronously, but the HTTP round trip is not. */
const settle = () => new Promise((r) => setTimeout(r, 150));

const q = await (await fetch(`${BASE}/api/quizzes`)).json();
const quizId = (Array.isArray(q) ? q : q.quizzes)[0].id;

/** A room sitting on the results screen with `n` players, none of them ready. */
async function roomAtResults(n) {
  const hostId = `h${Math.random().toString(36).slice(2)}`;
  const created = await post({ action: "create", hostId, quizIds: [quizId], questionCount: 5 });
  const { code, hostToken } = created.json;

  const players = [];
  for (let i = 0; i < n; i++) {
    const playerId = `p${i}_${Math.random().toString(36).slice(2, 7)}`;
    const j = await post({
      action: "join", code, playerId, name: `Player${i}`,
      emoji: "d2:1:2:3:4:-1:-1:-1:5:0:0",
    });
    players.push({ playerId, token: j.json.playerToken });
  }

  await post({ action: "start", code, hostId, hostToken });
  // Jump straight to results rather than answering: this is about the gate,
  // and it keeps the script working whatever question type comes up first.
  await post({ action: "force-results", code, hostId, hostToken });
  return { code, hostId, hostToken, players };
}

console.log(`\n  Ready-gate against ${BASE}\n`);

// 1. The seven-player game that actually happened.
{
  const r = await roomAtResults(7);
  for (const p of r.players.slice(0, 6)) {
    await post({ action: "ready", code: r.code, playerId: p.playerId, token: p.token });
  }
  const before = await snapshotOf(r.code, r.hostId, r.hostToken);
  console.log(`  · six of seven ready -> counter reads ${before.readyProgress.count}/${before.readyProgress.total}`);

  const leaver = r.players[6];
  await post({ action: "disconnect", code: r.code, playerId: leaver.playerId, token: leaver.token });
  await settle();

  const state = await stateOf(r.code);
  if (state === "results") flag("WEDGED: the seventh player left and the room stayed on results forever");
  else ok(`the seventh left and the room advanced to "${state}"`);
}

// 2. The counter has to shrink too, or it reads 6/7 with six people in the room.
{
  const r = await roomAtResults(4);
  await post({ action: "ready", code: r.code, playerId: r.players[0].playerId, token: r.players[0].token });
  const leaver = r.players[3];
  await post({ action: "disconnect", code: r.code, playerId: leaver.playerId, token: leaver.token });
  await settle();

  const snap = await snapshotOf(r.code, r.hostId, r.hostToken);
  const { count, total } = snap.readyProgress;
  if (total !== 3) flag(`stale counter: reads ${count}/${total} after one of four left, expected ${count}/3`);
  else ok(`counter shrank to ${count}/${total} when one of four left`);
  if ((await stateOf(r.code)) !== "results") flag("advanced early: one of four ready is not everyone");
  else ok("still waiting on the other two, as it should");
}

// 3. Everyone leaves. The gate must not fire a question into an empty room.
{
  const r = await roomAtResults(2);
  for (const p of r.players) {
    await post({ action: "disconnect", code: r.code, playerId: p.playerId, token: p.token });
  }
  await settle();
  const state = await stateOf(r.code);
  if (state !== "results") flag(`empty room advanced to "${state}" with nobody in it`);
  else ok("an empty room sits still and waits for the reaper");
}

// 4. The ordinary path still works: nobody leaves, everybody taps.
{
  const r = await roomAtResults(3);
  for (const p of r.players) {
    await post({ action: "ready", code: r.code, playerId: p.playerId, token: p.token });
  }
  await settle();
  const state = await stateOf(r.code);
  if (state === "results") flag("three of three tapped ready and the room did not advance");
  else ok(`all three tapped ready and the room advanced to "${state}"`);
}

console.log(`\n  problems found: ${problems.length}\n`);
process.exit(problems.length ? 1 : 0);
