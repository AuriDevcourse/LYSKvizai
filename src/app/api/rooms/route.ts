import { NextRequest, NextResponse } from "next/server";
import type { ClientAction } from "@/lib/multiplayer/types";

export const dynamic = "force-dynamic";
import { sanitizeEmoji, sanitizeText } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateAction } from "@/lib/multiplayer/validate";
import {
  createRoom,
  getRoom,
  joinRoom,
  startGame,
  submitAnswer,
  submitTextAnswer,
  submitYearAnswer,
  nextQuestion,
  disconnectPlayer,
  getRoomSnapshot,
  forceShowResults,
  submitWager,
  advanceFromWagerAction,
  choosePowerUp,
  isHostOf,
} from "@/lib/multiplayer/room-store";
import { broadcast } from "@/lib/multiplayer/sse-manager";
import { getClientIp } from "@/lib/client-ip";
import { readJsonBody, logServerError } from "@/lib/http";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Maps a room-store error to a status code.
 *
 * The host actions all returned **403** for every failure, including "Room not
 * found" — so a host whose room had been reaped (or lost on a deploy, since
 * the store is in memory) was told they lacked permission for their own game.
 * That sends you looking for an auth bug instead of a missing room.
 */
function statusFor(error: string): number {
  return /not found/i.test(error) ? 404 : 403;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit on the IP, which the client cannot choose.
  //
  // This used to key on `body.playerId ?? body.hostId ?? ip` so that friends
  // behind one NAT didn't share a bucket. But the client picks its own playerId,
  // so a fresh random id per request bought a fresh window — the limiter was a
  // no-op against anyone who wanted around it, and every made-up id also leaked
  // a Map entry. The NAT ceiling is raised instead: 240 requests per 10s is far
  // above what a full room of real players generates.
  if (!checkRateLimit(`post:${ip}`, 240, 10_000)) {
    return json({ error: "Too many requests" }, 429);
  }

  // Bounded before parsing. `req.json()` has no size limit of its own, so an
  // oversized body was buffered in full and only then rejected for its shape.
  const body_ = await readJsonBody(req);
  if (!body_.ok) return json({ error: body_.error }, body_.status);
  const parsed: unknown = body_.value;

  // Validate before anything touches the room store. `req.json()` is `any`;
  // the ClientAction cast alone proves nothing at runtime.
  const validated = validateAction(parsed);
  if ("error" in validated) return json({ error: validated.error }, 400);
  const body: ClientAction = validated.action;

  switch (body.action) {
    case "create": {
      try {
        // Support both quizId (legacy) and quizIds (array)
        const quizIds: string[] = body.quizIds ?? (body.quizId ? [body.quizId] : []);
        const room = await createRoom(
          body.hostId,
          quizIds,
          body.questionCount,
          body.timerDuration,
          body.gameMode,
          body.teamCount,
          body.eliminationInterval
        );
        return json({
          code: room.code,
          hostToken: room.hostToken,
          snapshot: getRoomSnapshot(room),
        });
      } catch (e) {
        // A create failure is usually a bad quiz id (a client problem, hence
        // 400), but a filesystem or parse failure lands here too and left no
        // trace at all.
        logServerError("createRoom failed", e);
        return json({ error: e instanceof Error ? e.message : "Error creating room" }, 400);
      }
    }

    case "join": {
      const result = joinRoom(body.code, body.playerId, body.name, body.emoji, body.token);
      if ("error" in result) return json({ error: result.error }, 400);
      return json({
        snapshot: getRoomSnapshot(result.room),
        playerToken: result.player.token,
      });
    }

    case "start": {
      const result = await startGame(body.code, body.hostId, body.hostToken);
      if (result.error) return json({ error: result.error }, statusFor(result.error));
      return json({ ok: true });
    }

    case "answer": {
      const result = submitAnswer(body.code, body.playerId, body.token, body.answerIndex);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "next": {
      const result = nextQuestion(body.code, body.hostId, body.hostToken);
      if (result.error) return json({ error: result.error }, statusFor(result.error));
      return json({ ok: true });
    }

    case "force-results": {
      const result = forceShowResults(body.code, body.hostId, body.hostToken);
      if (result.error) return json({ error: result.error }, statusFor(result.error));
      return json({ ok: true });
    }

    case "submit-wager": {
      const result = submitWager(body.code, body.playerId, body.token, body.amount);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "advance-wager": {
      const result = advanceFromWagerAction(body.code, body.hostId, body.hostToken);
      if (result.error) return json({ error: result.error }, statusFor(result.error));
      return json({ ok: true });
    }

    case "answer-text": {
      const safeAnswer = sanitizeText(body.answer, 200);
      const result = submitTextAnswer(body.code, body.playerId, body.token, safeAnswer);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "answer-year": {
      const result = submitYearAnswer(body.code, body.playerId, body.token, body.year);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "react": {
      const room = getRoom(body.code);
      if (!room) return json({ error: "Room not found" }, 404);
      // Only verified participants can react — blocks random outsiders from spamming.
      const player = room.players.get(body.playerId);
      if (!player || player.token !== body.token) {
        return json({ error: "Invalid session" }, 403);
      }
      const safeEmoji = sanitizeEmoji(body.emoji);
      if (!safeEmoji) return json({ error: "Invalid emoji" }, 400);
      broadcast(room.code, {
        type: "emoji-reaction",
        data: {
          playerId: body.playerId,
          playerName: player.name,
          playerEmoji: player.emoji,
          emoji: safeEmoji,
        },
      });
      return json({ ok: true });
    }

    case "disconnect": {
      // Fire-and-forget, but token-gated: only the player themselves can say
      // they're leaving. Silently a no-op on a bad token.
      disconnectPlayer(body.code, body.playerId, body.token);
      return json({ ok: true });
    }

    case "choose-powerup": {
      const result = choosePowerUp(body.code, body.playerId, body.token, body.powerUp);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    default:
      return json({ error: "Unknown action" }, 400);
  }
}

/**
 * GET /api/rooms?code=XXXX — get room snapshot (for initial load / reconnect).
 * Optional ?hostId=&hostToken= returns { isHost: true } if the caller owns the room.
 * Never leaks the server-side hostId or hostToken.
 */
export async function GET(req: NextRequest) {
  /*
   * 300 per 10s, not 30.
   *
   * Every player in a room is on the same Wi-Fi and therefore the same public
   * IP, and a room holds 50. At 30 per 10s, fifty players opening the join
   * screen together produced thirty 200s and twenty 429s — measured. The
   * ceiling has to clear a full room comfortably; this is 30 requests a second
   * per IP, which still stops a flood but stops punishing a group for sharing
   * a network.
   */
  const ip = getClientIp(req);
  if (!checkRateLimit(`get:${ip}`, 300, 10_000)) {
    return json({ error: "Too many requests" }, 429);
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return json({ error: "Missing room code" }, 400);

  const room = getRoom(code);
  if (!room) return json({ error: "Room not found" }, 404);

  /*
   * Credentials come from headers, not the query string.
   *
   * The host token used to be passed as `?hostToken=…`, which puts a
   * credential everywhere URLs get written down: proxy access logs, browser
   * history, `Referer`. Headers are not logged by default.
   */
  const hostId = req.headers.get("x-host-id");
  const hostToken = req.headers.get("x-host-token");
  const isHost = !!(hostId && hostToken && isHostOf(code, hostId, hostToken));

  const playerId = req.headers.get("x-player-id");
  const playerToken = req.headers.get("x-player-token");
  const player = playerId ? room.players.get(playerId) : undefined;
  const isMember = !!(player && playerToken && player.token === playerToken);

  /*
   * Room codes are four characters — about 1.7M combinations, with no
   * per-code lockout. This route used to hand the **entire snapshot** to
   * anyone who guessed one: every player's name, the live question, and during
   * the results phase `correctAnswer` itself. Scanning for active rooms was a
   * matter of patience.
   *
   * Unauthenticated callers now get only what the join screen legitimately
   * needs to know — that the room is real and whether it has started.
   */
  if (!isHost && !isMember) {
    return json({
      exists: true,
      state: room.state,
      playerCount: room.players.size,
      isHost: false,
    });
  }

  return json({
    exists: true,
    state: room.state,
    isHost,
    snapshot: getRoomSnapshot(room),
  });
}
