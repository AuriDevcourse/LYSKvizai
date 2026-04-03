import { NextRequest, NextResponse } from "next/server";
import type { ClientAction } from "@/lib/multiplayer/types";
import { sanitizeEmoji, sanitizeText } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
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
} from "@/lib/multiplayer/room-store";
import { broadcast } from "@/lib/multiplayer/sse-manager";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 60 requests per 10 seconds per IP
  if (!checkRateLimit(`post:${ip}`, 60, 10_000)) {
    return json({ error: "Too many requests" }, 429);
  }

  let body: ClientAction;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request format" }, 400);
  }

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
          snapshot: getRoomSnapshot(room),
        });
      } catch (e) {
        return json({ error: e instanceof Error ? e.message : "Error creating room" }, 400);
      }
    }

    case "join": {
      const result = joinRoom(body.code, body.playerId, body.name, body.emoji);
      if ("error" in result) return json({ error: result.error }, 400);
      return json({
        snapshot: getRoomSnapshot(result.room),
      });
    }

    case "start": {
      const result = await startGame(body.code, body.hostId);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "answer": {
      const result = submitAnswer(body.code, body.playerId, body.answerIndex);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "next": {
      const result = nextQuestion(body.code, body.hostId);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "force-results": {
      const result = forceShowResults(body.code, body.hostId);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "submit-wager": {
      const result = submitWager(body.code, body.playerId, body.amount);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "advance-wager": {
      const result = advanceFromWagerAction(body.code, body.hostId);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "answer-text": {
      const safeAnswer = sanitizeText(body.answer, 200);
      const result = submitTextAnswer(body.code, body.playerId, safeAnswer);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "answer-year": {
      const result = submitYearAnswer(body.code, body.playerId, body.year);
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    case "react": {
      const room = getRoom(body.code);
      if (!room) return json({ error: "Room not found" }, 404);
      const player = room.players.get(body.playerId);
      if (!player) return json({ error: "Player not found" }, 404);
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
      disconnectPlayer(body.code, body.playerId);
      return json({ ok: true });
    }

    case "choose-powerup": {
      const result = choosePowerUp(body.code, body.playerId, body.powerUp as "freeze" | "shield" | "double");
      if (result.error) return json({ error: result.error }, 400);
      return json({ ok: true });
    }

    default:
      return json({ error: "Unknown action" }, 400);
  }
}

/** GET /api/rooms?code=XXXX — get room snapshot (for initial load / reconnect) */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`get:${ip}`, 30, 10_000)) {
    return json({ error: "Too many requests" }, 429);
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return json({ error: "Missing room code" }, 400);

  const room = getRoom(code);
  if (!room) return json({ error: "Room not found" }, 404);

  return json({ snapshot: getRoomSnapshot(room), hostId: room.hostId });
}
