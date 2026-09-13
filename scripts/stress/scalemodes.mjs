/**
 * Scale rounds under the game modes nobody had played them in.
 *
 * `RoundType` and `GameMode` are independent by design: a scale room can be
 * classic, team or elimination. That was asserted by the type system and by
 * nothing else. Team mode in particular gates who may answer, and the scale
 * submit path had to be taught the same rule as every other submit path.
 *
 * Also checks the fastest-answer bonus no longer leaves the leaderboard behind
 * the player's own row, which was true on every game type.
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

const asHost = (code, hostId, hostToken) =>
  fetch(`${BASE}/api/rooms?code=${code}`, {
    headers: { "x-host-id": hostId, "x-host-token": hostToken },
  }).then((r) => r.json());

const asPlayer = (code, playerId, token) =>
  fetch(`${BASE}/api/rooms?code=${code}`, {
    headers: { "x-player-id": playerId, "x-player-token": token },
  }).then((r) => r.json());

const settle = () => new Promise((r) => setTimeout(r, 150));

async function room(opts) {
  const hostId = `h${Math.random().toString(36).slice(2)}`;
  const c = await post({ action: "create", hostId, roundType: "scale", questionCount: 5, ...opts });
  if (c.status !== 200) throw new Error(`create failed: ${c.json?.error}`);
  const players = [];
  for (const name of ["Ann", "Bob", "Cat", "Dee"]) {
    const playerId = `p_${name}_${Math.random().toString(36).slice(2, 6)}`;
    const j = await post({
      action: "join", code: c.json.code, playerId, name, emoji: "d2:1:2:3:4:-1:-1:-1:5:0:0",
    });
    players.push({ name, playerId, token: j.json.playerToken });
  }
  await post({ action: "start", code: c.json.code, hostId, hostToken: c.json.hostToken });
  return { code: c.json.code, hostId, hostToken: c.json.hostToken, players };
}

console.log(`\n  Scale under every game mode, against ${BASE}\n`);

// 1. TEAM MODE. Only the designated answerer may guess.
{
  console.log("  Team mode");
  const r = await room({ gameMode: "team", teamCount: 2 });
  const snap = await asPlayer(r.code, r.players[0].playerId, r.players[0].token);
  const q = snap.snapshot.question;

  if (!q?.scale) {
    flag("team mode: no scale round reached the players");
  } else {
    ok(`scale round served in team mode: ${q.scale.reference.id} vs ${q.scale.target.id}`);
    const answerers = q.currentTeamAnswerers ?? [];
    if (answerers.length === 0) flag("team mode: nobody was designated to answer");
    else ok(`${answerers.length} designated answerer(s)`);

    const designated = r.players.filter((p) => answerers.includes(p.playerId));
    const benched = r.players.filter((p) => !answerers.includes(p.playerId));

    /*
     * The benched player goes first, on purpose. Once the designated answerers
     * have all guessed the round ends on its own, and a refusal after that is
     * "Can't answer right now" for every player alive, which proves nothing
     * about the team rule.
     */
    for (const p of benched.slice(0, 1)) {
      const res = await post({ action: "answer-scale", code: r.code, playerId: p.playerId, token: p.token, metres: q.scale.referenceHeightM });
      if (res.status === 200) flag(`TEAM RULE BROKEN: ${p.name} guessed while not the designated answerer`);
      else if (!/another team member/i.test(res.json?.error ?? "")) {
        flag(`a non-answerer was refused, but for the wrong reason: ${res.json?.error}`);
      } else ok(`a non-answerer was refused: ${res.json?.error}`);
    }

    for (const p of designated) {
      const res = await post({ action: "answer-scale", code: r.code, playerId: p.playerId, token: p.token, metres: q.scale.referenceHeightM * 1.3 });
      if (res.status !== 200) flag(`team mode: the designated answerer was refused: ${res.json?.error}`);
    }
    if (designated.length) ok("the designated answerer could guess");

    await post({ action: "force-results", code: r.code, hostId: r.hostId, hostToken: r.hostToken });
    const res = (await asHost(r.code, r.hostId, r.hostToken)).snapshot.results;
    if (!res?.teamScores?.length) flag("team mode: no team scores on a scale round");
    else ok(`team scores present: ${res.teamScores.map((t) => `${t.teamName} ${t.score}`).join(", ")}`);
  }
}

// 2. ELIMINATION. The lowest scorer goes out; the room must keep running.
{
  console.log("\n  Elimination mode");
  const r = await room({ gameMode: "elimination", eliminationInterval: 1 });
  const q = (await asPlayer(r.code, r.players[0].playerId, r.players[0].token)).snapshot.question;

  if (!q?.scale) {
    flag("elimination: no scale round reached the players");
  } else {
    // Spread the guesses so there is a clear worst.
    const mult = [1.05, 1.6, 3.0, 0.02];
    for (let i = 0; i < r.players.length; i++) {
      await post({ action: "answer-scale", code: r.code, playerId: r.players[i].playerId, token: r.players[i].token, metres: q.scale.referenceHeightM * mult[i] });
    }
    await post({ action: "force-results", code: r.code, hostId: r.hostId, hostToken: r.hostToken });
    const res = (await asHost(r.code, r.hostId, r.hostToken)).snapshot.results;

    const out = res?.eliminatedThisRound ?? [];
    if (out.length === 0) ok("nobody eliminated this round (interval not reached)");
    else ok(`eliminated: ${out.map((e) => e.playerName).join(", ")}`);

    // An eliminated player must not be able to guess, and must not hold up the gate.
    if (out.length) {
      const gone = r.players.find((p) => p.playerId === out[0].playerId);
      const attempt = await post({ action: "answer-scale", code: r.code, playerId: gone.playerId, token: gone.token, metres: 1 });
      if (attempt.status === 200) flag("an eliminated player guessed on a scale round");
      else ok(`an eliminated player is refused: ${attempt.json?.error}`);

      const snap = await asHost(r.code, r.hostId, r.hostToken);
      const prog = snap.snapshot.readyProgress;
      const expected = r.players.length - out.length;
      if (prog && prog.total !== expected) {
        flag(`ready gate still counts the eliminated: total ${prog.total}, expected ${expected}`);
      } else if (prog) {
        ok(`ready gate expects ${prog.total}, the players still in`);
      }
    }

    // The room must still be able to advance.
    for (const p of r.players) {
      await post({ action: "ready", code: r.code, playerId: p.playerId, token: p.token });
    }
    await settle();
    const state = (await (await fetch(`${BASE}/api/rooms?code=${r.code}`)).json()).state;
    if (state === "results") flag("elimination: the room did not advance after everyone readied");
    else ok(`the room advanced to "${state}"`);
  }
}

// 3. The fastest-answer bonus must not leave the leaderboard behind.
//    A normal quiz round, because scale deliberately pays no speed bonus.
{
  console.log("\n  Fastest-answer bonus, normal quiz round");
  const qz = await (await fetch(`${BASE}/api/quizzes`)).json();
  const quizId = (Array.isArray(qz) ? qz : qz.quizzes)[0].id;
  const hostId = `h${Math.random().toString(36).slice(2)}`;
  const c = await post({ action: "create", hostId, quizIds: [quizId], questionCount: 12 });
  const list = [];
  for (const name of ["Fast", "Slow", "Also"]) {
    const playerId = `p_${name}_${Math.random().toString(36).slice(2, 6)}`;
    const j = await post({ action: "join", code: c.json.code, playerId, name, emoji: "d2:1:2:3:4:-1:-1:-1:5:0:0" });
    list.push({ name, playerId, token: j.json.playerToken });
  }
  await post({ action: "start", code: c.json.code, hostId, hostToken: c.json.hostToken });

  /*
   * The bonus needs at least two correct answers in one round, and a client
   * cannot know which option is correct. So everyone picks the same option and
   * we walk the four of them across rounds: one round in four lands on it for
   * all three players at once.
   */
  let checked = false;
  for (let round = 0; round < 12 && !checked; round++) {
    for (const p of list) {
      await post({ action: "answer", code: c.json.code, playerId: p.playerId, token: p.token, answerIndex: round % 4 });
    }
    await post({ action: "force-results", code: c.json.code, hostId, hostToken: c.json.hostToken });
    const res = (await asHost(c.json.code, hostId, c.json.hostToken)).snapshot.results;

    const bonusRow = res?.playerResults?.find((x) => x.speedBonus);
    if (bonusRow) {
      const board = res.leaderboard.find((e) => e.playerId === bonusRow.playerId);
      if (!board) flag("the player who got the bonus is missing from the leaderboard");
      else if (board.score !== bonusRow.totalScore) {
        flag(`bonus mismatch: result row ${bonusRow.totalScore}, leaderboard ${board.score} (${bonusRow.speedBonus} lost on the way)`);
      } else {
        ok(`bonus of ${bonusRow.speedBonus} appears in both the result row and the leaderboard (${board.score})`);
      }

      // Every row must agree, not only the one that got the bonus.
      for (const row of res.playerResults) {
        const e = res.leaderboard.find((x) => x.playerId === row.playerId);
        if (e && e.score !== row.totalScore) {
          flag(`${row.playerName}: result row ${row.totalScore}, leaderboard ${e.score}`);
        }
      }

      // And the ranking must reflect the score printed beside it.
      const ordered = [...res.leaderboard].sort((a, b) => a.rank - b.rank);
      for (let i = 1; i < ordered.length; i++) {
        if (ordered[i - 1].score < ordered[i].score) {
          flag(`ranking disagrees with score: rank ${ordered[i - 1].rank} has ${ordered[i - 1].score}, rank ${ordered[i].rank} has ${ordered[i].score}`);
        }
      }
      checked = true;
      break;
    }

    for (const p of list) {
      await post({ action: "ready", code: c.json.code, playerId: p.playerId, token: p.token });
    }
    await settle();
  }
  if (!checked) flag("never saw a speed bonus in 12 rounds; the check did not run");
}

console.log(`\n  problems found: ${problems.length}\n`);
process.exit(problems.length ? 1 : 0);
