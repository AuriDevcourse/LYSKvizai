/**
 * A scale room, played through the real API.
 *
 * Scale rounds are generated from the creature pool rather than read from a
 * quiz, and scored in log space rather than by matching an option, so almost
 * nothing about them shares a code path with a normal question. This drives one
 * whole room: the pair reaches the players, a guess is scored, a perfect guess
 * beats a wild one, and no phone is ever sent the answer before the reveal.
 *
 * LOCALHOST ONLY.
 */
const BASE = process.env.BASE ?? "http://localhost:3001";
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

const asHost = (code, hostId, hostToken) =>
  fetch(`${BASE}/api/rooms?code=${code}`, {
    headers: { "x-host-id": hostId, "x-host-token": hostToken },
  }).then((r) => r.json());

/** State changes are synchronous on the server; the HTTP round trip is not. */
const settle = () => new Promise((r) => setTimeout(r, 150));

const asPlayer = (code, playerId, token) =>
  fetch(`${BASE}/api/rooms?code=${code}`, {
    headers: { "x-player-id": playerId, "x-player-token": token },
  }).then((r) => r.json());

/*
 * Heights the payload must never contain before the reveal. Hard-coded rather
 * than imported: the script is plain .mjs and the table is TypeScript, and a
 * check that imported the same module it is policing would be circular anyway.
 */
const SIZES = { cat: 0.24, penguin: 1.1, knight: 1.75, ostrich: 2.7,
                elephant: 3.2, trex: 3.7, bus: 4.4, giraffe: 5.2 };

console.log(`\n  Scale round against ${BASE}\n`);

const hostId = `h${Math.random().toString(36).slice(2)}`;
const created = await post({ action: "create", hostId, roundType: "scale", questionCount: 4 });
if (created.status !== 200) {
  flag(`could not create a scale room: ${created.status} ${created.json?.error}`);
  process.exit(1);
}
const { code, hostToken } = created.json;
ok(`scale room ${code} created with no quiz selected`);

const players = [];
for (const name of ["Sharp", "Wild", "Silent"]) {
  const playerId = `p_${name}_${Math.random().toString(36).slice(2, 6)}`;
  const j = await post({
    action: "join", code, playerId, name, emoji: "d2:1:2:3:4:-1:-1:-1:5:0:0",
  });
  players.push({ name, playerId, token: j.json.playerToken });
}
await post({ action: "start", code, hostId, hostToken });

// 1. The pair reaches the player, and the answer does not.
const snap = await asPlayer(code, players[0].playerId, players[0].token);
const q = snap.snapshot?.question;
if (q?.type !== "scale") flag(`question type is "${q?.type}", expected "scale"`);
else ok(`question arrived as a scale round: "${q.question}"`);

if (!q?.scale?.reference?.id || !q?.scale?.target?.id) flag("no creature pair in the question payload");
else ok(`pair sent: ${q.scale.reference.id} vs ${q.scale.target.id}, reference ${q.scale.referenceHeightM} m`);

/*
 * The answer must not reach a phone before the reveal, by any route. Checked
 * against the serialised payload rather than a named field, because the leak
 * that existed was not a field at all: the client looked the target up in its
 * own bundled copy of the creature table, which carries every height.
 */
{
  const named = q?.scale && ("targetHeightM" in q.scale || "heightM" in (q.scale.target ?? {}));
  if (named) flag("LEAK: the target's height was sent as a field before the reveal");
  else ok("no height field on the target in the question payload");

  /*
   * And not by any other route either. The reference height is sent on purpose
   * (it is printed on screen and the guess is measured against it), so only the
   * target's number is contraband.
   */
  const targetHeight = SIZES[q?.scale?.target?.id];
  if (targetHeight === undefined) {
    console.log(`  . ${q?.scale?.target?.id} is not in the script's size table; height check skipped`);
  } else if (JSON.stringify(q).includes(String(targetHeight))) {
    flag(`LEAK: the target's real height (${targetHeight}) appears in the question payload`);
  } else {
    ok(`the target's real height is nowhere in the payload`);
  }
}

// 2. Scoring. One player nails it, one is wildly out, one never answers.
const refM = q.scale.referenceHeightM;
// The sharp player guesses the truth. Read it from the server the only honest
// way available to a test: play the round, then compare against the reveal.
const sharpGuess = refM * 2;
const wildGuess = refM * 0.01;
await post({ action: "answer-scale", code, playerId: players[0].playerId, token: players[0].token, metres: sharpGuess });
await post({ action: "answer-scale", code, playerId: players[1].playerId, token: players[1].token, metres: wildGuess });

const dupe = await post({ action: "answer-scale", code, playerId: players[0].playerId, token: players[0].token, metres: refM });
if (dupe.status === 200) flag("a player answered the same scale round twice");
else ok(`second guess refused: ${dupe.json?.error}`);

const bad = await post({ action: "answer-scale", code, playerId: players[2].playerId, token: players[2].token, metres: "big" });
if (bad.status === 200) flag("a non-numeric size was accepted");
else ok(`non-numeric size refused: ${bad.json?.error}`);

const nan = await post({ action: "answer-scale", code, playerId: players[2].playerId, token: players[2].token, metres: Number.NaN });
if (nan.status === 200) flag("NaN was accepted as a size");
else ok(`NaN refused: ${nan.json?.error}`);

// 3. The reveal.
await post({ action: "force-results", code, hostId, hostToken });
const hostView = await asHost(code, hostId, hostToken);
const results = hostView.snapshot?.results;

if (!results?.scaleGuesses) flag("no scaleGuesses in the results payload");
else {
  const rows = results.scaleGuesses;
  ok(`results carry ${rows.length} guess(es): ${rows.map((g) => `${g.playerName} ${g.guessedM.toFixed(2)}m/${g.points}pts`).join(", ")}`);

  const silent = rows.find((g) => g.playerName === "Silent");
  if (silent) flag("a player who never guessed appears in the results");
  else ok("the player who never guessed is absent, not scored as zero metres");

  const sharp = rows.find((g) => g.playerName === "Sharp");
  const wild = rows.find((g) => g.playerName === "Wild");
  if (!sharp || !wild) flag("a guess went missing from the results");
  else {
    /*
     * Not "the closer guess wins": the test cannot know the answer before the
     * reveal, and the sharp guess is only 2x the reference, which a pairing up
     * to 25x apart can leave further out than it looks. What must hold is that
     * points track accuracy, whichever way round they land.
     */
    const byAccuracy = [...rows].sort((a, b) => b.accuracy - a.accuracy);
    const monotonic = byAccuracy.every((g, i) => i === 0 || byAccuracy[i - 1].points >= g.points);
    if (!monotonic) flag(`points do not track accuracy: ${byAccuracy.map((g) => `${g.accuracy.toFixed(1)}%/${g.points}`).join(" ")}`);
    else ok(`points track accuracy: ${byAccuracy.map((g) => `${g.accuracy.toFixed(0)}%=${g.points}`).join(" ")}`);
    if (wild.points !== 0) flag(`a 100x-out guess still scored ${wild.points}`);
    else ok("a 100x-out guess scored zero");
    if (rows[0].accuracy < rows[rows.length - 1].accuracy) flag("guesses are not sorted closest-first");
    else ok("guesses are sorted closest-first");
    if (!Number.isFinite(sharp.actualM) || sharp.actualM <= 0) flag(`actualM is not a real height: ${sharp.actualM}`);
    else ok(`the truth is revealed now: ${sharp.actualM} m`);
  }
}

// 4. Speed must not pay on a scale round. Whoever guesses first has done
//    nothing the game measures, and the has-answered flag made them look like
//    the fastest correct answer on a normal question.
const rows = results?.playerResults ?? [];
const tipped = rows.filter((r) => r.speedBonus);
if (tipped.length) flag(`a speed bonus was paid on a scale round: ${tipped.map((r) => `${r.playerName} +${r.speedBonus}`).join(", ")}`);
else ok("no speed bonus paid for guessing first");

// 5. The three places a score appears must agree.
for (const row of rows) {
  const guess = results.scaleGuesses?.find((g) => g.playerId === row.playerId);
  const board = results.leaderboard?.find((e) => e.playerId === row.playerId);
  if (guess && row.points !== guess.points) {
    flag(`${row.playerName}: the guess row says ${guess.points} and the result row says ${row.points}`);
  } else if (board && row.totalScore !== board.score) {
    flag(`${row.playerName}: the result row says ${row.totalScore} and the leaderboard says ${board.score}`);
  }
}
if (!problems.length) ok("guess row, result row and leaderboard all agree");

// 6. The leaderboard moved by the points that were reported.
const board = results?.leaderboard ?? [];
const sharpRow = results?.scaleGuesses?.find((g) => g.playerName === "Sharp");
const sharpBoard = board.find((e) => e.name === "Sharp");
if (sharpRow && sharpBoard && sharpBoard.score !== sharpRow.points) {
  flag(`leaderboard says ${sharpBoard.score} but the round reported ${sharpRow.points}`);
} else if (sharpRow && sharpBoard) {
  ok(`leaderboard agrees with the round: ${sharpBoard.score}`);
}

// ---------------------------------------------------------------------------
// The two paths the plain round never reaches. Both were silently wrong: the
// wager was announced on screen and never paid, and the Double power-up made
// the guess row and the leaderboard beside it disagree.
// ---------------------------------------------------------------------------

async function scaleRoom(rounds) {
  const hostId = `h${Math.random().toString(36).slice(2)}`;
  const c = await post({ action: "create", hostId, roundType: "scale", questionCount: rounds });
  const list = [];
  for (const name of ["Ann", "Bob"]) {
    const playerId = `p_${name}_${Math.random().toString(36).slice(2, 6)}`;
    const j = await post({
      action: "join", code: c.json.code, playerId, name, emoji: "d2:1:2:3:4:-1:-1:-1:5:0:0",
    });
    list.push({ name, playerId, token: j.json.playerToken });
  }
  await post({ action: "start", code: c.json.code, hostId, hostToken: c.json.hostToken });
  return { code: c.json.code, hostId, hostToken: c.json.hostToken, players: list };
}

const scoreOf = async (room, name) => {
  const snap = await asHost(room.code, room.hostId, room.hostToken);
  return snap.snapshot.players.find((p) => p.name === name)?.score ?? 0;
};

const questionOf = async (room, p) => {
  const snap = await asPlayer(room.code, p.playerId, p.token);
  return snap.snapshot.question;
};

// A. The wager round.
console.log(`\n  Wager on a scale round\n`);
{
  // Two rounds, so the wager phase fires before the final one.
  const room = await scaleRoom(2);

  let q = await questionOf(room, room.players[0]);
  for (const p of room.players) {
    await post({ action: "answer-scale", code: room.code, playerId: p.playerId, token: p.token, metres: q.scale.referenceHeightM * 1.4 });
  }
  await post({ action: "force-results", code: room.code, hostId: room.hostId, hostToken: room.hostToken });
  for (const p of room.players) {
    await post({ action: "ready", code: room.code, playerId: p.playerId, token: p.token });
  }
  await settle();

  const phase = (await (await fetch(`${BASE}/api/rooms?code=${room.code}`)).json()).state;
  if (phase !== "wager") {
    flag(`expected a wager phase before the final scale round, got "${phase}"`);
  } else {
    ok("the wager phase fires before the final scale round");

    const before = {};
    for (const p of room.players) before[p.name] = await scoreOf(room, p.name);

    for (const p of room.players) {
      const r = await post({ action: "submit-wager", code: room.code, playerId: p.playerId, token: p.token, amount: 250 });
      if (r.status !== 200) flag(`wager refused: ${r.json?.error}`);
    }
    await settle();

    q = await questionOf(room, room.players[0]);
    if (!q?.scale) {
      flag("no scale round after the wager phase");
    } else {
      // One good guess, one absurd one, so one wager is won and one lost.
      await post({ action: "answer-scale", code: room.code, playerId: room.players[0].playerId, token: room.players[0].token, metres: q.scale.referenceHeightM * 1.2 });
      await post({ action: "answer-scale", code: room.code, playerId: room.players[1].playerId, token: room.players[1].token, metres: q.scale.referenceHeightM * 0.005 });
      await post({ action: "force-results", code: room.code, hostId: room.hostId, hostToken: room.hostToken });

      const snap = await asHost(room.code, room.hostId, room.hostToken);
      const res = snap.snapshot.results;
      for (const p of room.players) {
        const swing = res.wagerResults?.find((w) => w.playerName === p.name);
        const row = res.playerResults.find((r) => r.playerName === p.name);
        const after = await scoreOf(room, p.name);
        if (!swing) { flag(`${p.name}: no wager row on the results screen`); continue; }
        const moved = after - before[p.name];
        const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);
        if (moved !== row.points) {
          flag(`${p.name}: the screen says ${sign(row.points)} but the score moved by ${sign(moved)} (wager ${sign(swing.netPoints)} announced)`);
        } else {
          ok(`${p.name}: screen and score agree at ${sign(moved)}, wager ${sign(swing.netPoints)} included`);
        }
      }
    }
  }
}

// B. The Double power-up.
console.log(`\n  Double power-up on a scale round\n`);
{
  const room = await scaleRoom(3);
  const dee = room.players[0];

  const pu = await post({ action: "choose-powerup", code: room.code, playerId: dee.playerId, token: dee.token, powerUp: "double" });
  if (pu.status !== 200) {
    console.log(`  . Double not offered this round (${pu.json?.error}); nothing to check`);
  } else {
    const q = await questionOf(room, dee);
    await post({ action: "answer-scale", code: room.code, playerId: dee.playerId, token: dee.token, metres: q.scale.referenceHeightM * 1.3 });
    await post({ action: "force-results", code: room.code, hostId: room.hostId, hostToken: room.hostToken });

    const snap = await asHost(room.code, room.hostId, room.hostToken);
    const res = snap.snapshot.results;
    const guessRow = res.scaleGuesses?.find((g) => g.playerName === dee.name);
    const resultRow = res.playerResults.find((r) => r.playerName === dee.name);
    const boardRow = res.leaderboard.find((e) => e.name === dee.name);
    if (!guessRow || !resultRow || !boardRow) {
      flag("Double round: a row went missing from the results");
    } else if (guessRow.points !== resultRow.points || resultRow.totalScore !== boardRow.score) {
      flag(`Double round disagreement: guess row ${guessRow.points}, result row ${resultRow.points}, leaderboard ${boardRow.score}`);
    } else {
      ok(`Double round: all three agree at ${guessRow.points}`);
    }
  }
}

console.log(`\n  problems found: ${problems.length}\n`);
process.exit(problems.length ? 1 : 0);
