import { NextRequest, NextResponse } from "next/server";
import type { ClientAction } from "@/lib/multiplayer/types";
import {
  createRoom,
  getRoom,
  joinRoom,
  startGame,
  submitAnswer,
  nextQuestion,
  disconnectPlayer,
  getRoomSnapshot,
  forceShowResults,
  usePowerUp,
  submitWager,
  advanceFromWagerAction,
} from "@/lib/multiplayer/room-store";
import { broadcast } from "@/lib/multiplayer/sse-manager";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  let body: ClientAction;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Netinkamas užklausos formatas" }, 400);
  }

  switch (body.action) {
    case "create": {
      try {
        const room = await createRoom(
          body.hostId,
          body.quizId,
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
        return json({ error: e instanceof Error ? e.message : "Klaida kuriant kambarį" }, 400);
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
      const result = startGame(body.code, body.hostId);
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

    case "use-powerup": {
      const result = usePowerUp(body.code, body.playerId, body.powerUp);
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

    case "react": {
      const room = getRoom(body.code);
      if (!room) return json({ error: "Kambarys nerastas" }, 404);
      const player = room.players.get(body.playerId);
      if (!player) return json({ error: "Žaidėjas nerastas" }, 404);
      broadcast(body.code, {
        type: "emoji-reaction",
        data: {
          playerId: body.playerId,
          playerName: player.name,
          playerEmoji: player.emoji,
          emoji: body.emoji,
        },
      });
      return json({ ok: true });
    }

    case "disconnect": {
      disconnectPlayer(body.code, body.playerId);
      return json({ ok: true });
    }

    default:
      return json({ error: "Nežinomas veiksmas" }, 400);
  }
}

/** GET /api/rooms?code=XXXX — get room snapshot (for initial load / reconnect) */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return json({ error: "Trūksta kambario kodo" }, 400);

  const room = getRoom(code);
  if (!room) return json({ error: "Kambarys nerastas" }, 404);

  return json({ snapshot: getRoomSnapshot(room) });
}
