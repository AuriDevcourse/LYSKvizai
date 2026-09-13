/**
 * Does a multiplayer room honour the game type the host picked?
 *
 * It did not. The topic picker showed six game-type chips on the host screen,
 * filtered the topic list by the choice (which made it look like it had taken),
 * and then `createRoom` served every question exactly as authored, because it
 * had no game-type parameter at all and `transformQuestions` was only ever
 * called from the solo `/quiz` route. Picking "Mixed Mode" for a room full of
 * people produced a straight classic quiz.
 *
 * This walks a room through its rounds and reports the types actually served.
 *
 * LOCALHOST ONLY.
 */
const BASE = process.env.BASE ?? "http://localhost:3005";
const problems = [];
const flag = (m) => { problems.push(m); console.log(`  x ${m}`); };
const ok = (m) => console.log(`  + ${m}`);

const post = async (b) => {
  const r = await fetch(`${BASE}/api/rooms`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b),
  });
  let j = null;
  try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};

const settle = () => new Promise((r) => setTimeout(r, 120));

/** Play `rounds` rounds and collect the type of each question served. */
async function typesServed(gameType, rounds = 8) {
  const quizzes = await (await fetch(`${BASE}/api/quizzes`)).json();
  const list = Array.isArray(quizzes) ? quizzes : quizzes.quizzes;
  // Several quizzes, so a filtering type (zoom-out, year) has enough to work with.
  const quizIds = list.slice(0, 8).map((q) => q.id);

  const hostId = `h${Math.random().toString(36).slice(2)}`;
  const created = await post({
    action: "create", hostId, quizIds, questionCount: rounds, gameType,
  });
  if (created.status !== 200) return { error: created.json?.error };
  const { code, hostToken } = created.json;

  const playerId = `p${Math.random().toString(36).slice(2, 7)}`;
  const joined = await post({
    action: "join", code, playerId, name: "Probe", emoji: "d2:1:2:3:4:-1:-1:-1:5:0:0",
  });
  const token = joined.json.playerToken;
  await post({ action: "start", code, hostId, hostToken });

  const seen = [];
  for (let i = 0; i < rounds; i++) {
    const state = (await (await fetch(`${BASE}/api/rooms?code=${code}`)).json()).state;
    if (state === "finished") break;
    if (state === "wager") {
      await post({ action: "submit-wager", code, playerId, token, amount: 0 });
      await settle();
      continue;
    }
    if (state === "results") {
      await post({ action: "ready", code, playerId, token });
      await settle();
      continue;
    }
    const snap = await (await fetch(`${BASE}/api/rooms?code=${code}`, {
      headers: { "x-player-id": playerId, "x-player-token": token },
    })).json();
    const q = snap.snapshot?.question;
    if (!q) break;
    seen.push(q.type ?? "standard");
    await post({ action: "force-results", code, hostId, hostToken });
    await post({ action: "ready", code, playerId, token });
    await settle();
  }
  return { seen };
}

console.log(`\n  Game types in a multiplayer room, against ${BASE}\n`);

// Each type must actually produce itself.
for (const gt of ["true-false", "fastest-finger", "year-guesser"]) {
  const { seen, error } = await typesServed(gt, 6);
  if (error) { flag(`${gt}: room could not be created (${error})`); continue; }
  if (!seen.length) { flag(`${gt}: no questions were served`); continue; }
  const wrong = seen.filter((t) => t !== gt);
  if (wrong.length) flag(`${gt}: served ${seen.join(", ")} — ${wrong.length} of ${seen.length} were not ${gt}`);
  else ok(`${gt}: every round served as ${gt} (${seen.length} rounds)`);
}

// Mixed must actually vary. One type across a whole game is the bug being fixed.
{
  const { seen, error } = await typesServed("mixed", 10);
  if (error) {
    flag(`mixed: room could not be created (${error})`);
  } else {
    const distinct = new Set(seen);
    console.log(`  · mixed served: ${seen.join(", ")}`);
    /*
     * Counting distinct types is not enough. `bluff` is authored into a few
     * quizzes and survives untouched, so a broken mixed mode still shows two
     * "different" types (standard and bluff) and passes a naive check. What
     * proves the transform ran is a type that can only exist because it did.
     */
    const derived = seen.filter((t) => ["true-false", "fastest-finger", "year-guesser", "zoom-out"].includes(t));
    if (derived.length === 0) {
      flag(`mixed produced nothing the transform could have made: ${seen.join(", ")}`);
    } else {
      ok(`mixed produced ${distinct.size} types across ${seen.length} rounds, ${derived.length} of them derived`);
    }
  }
}

// And the default must still be a plain quiz.
{
  const { seen } = await typesServed("standard", 5);
  const odd = seen.filter((t) => t !== "standard" && t !== "bluff");
  // `bluff` is authored into a few quizzes and is expected to survive untouched.
  if (odd.length) flag(`standard: a plain room served ${odd.join(", ")}`);
  else ok(`standard: a plain room is still a plain room (${seen.join(", ")})`);
}

console.log(`\n  problems found: ${problems.length}\n`);
process.exit(problems.length ? 1 : 0);
