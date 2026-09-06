"use client";

import { useEffect, useState } from "react";
import { Users, Play, QrCode, Swords, Skull, Volume2, VolumeX } from "lucide-react";
import type { PlayerInfo, GameMode } from "@/lib/multiplayer/types";
import { useSound } from "@/hooks/useSound";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import QRCodeComponent from "./QRCode";
import RoomCodeDisplay from "./RoomCodeDisplay";
import Avatar from "@/components/Avatar";

interface HostLobbyProps {
  code: string;
  players: PlayerInfo[];
  onStart: () => void;
  gameMode?: GameMode;
  teamNames?: string[];
}

export default function HostLobby({ code, players, onStart, gameMode = "classic", teamNames = [] }: HostLobbyProps) {
  const [joinUrl, setJoinUrl] = useState("");
  const [muted, setMuted] = useState(true);
  const { playLobby, stopLobby } = useSound();
  const { t } = useTranslation();

  useEffect(() => {
    return () => stopLobby();
  }, [stopLobby]);

  const toggleMute = () => {
    if (muted) {
      playLobby();
    } else {
      stopLobby();
    }
    setMuted(!muted);
  };

  useEffect(() => {
    // The QR code is the whole join flow, so never let a bad response through:
    // `.catch` only fires on a network error, so a 200 carrying no url used to
    // render "undefined/play?code=XXXX" into the QR.
    const fallback = `${window.location.origin}/play?code=${code}`;
    fetch("/api/network-url")
      .then((r) => r.json())
      .then((data) => {
        const base = typeof data?.url === "string" && data.url ? data.url : window.location.origin;
        setJoinUrl(`${base}/play?code=${code}`);
      })
      .catch(() => setJoinUrl(fallback));
  }, [code]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7">
      <div className="flex items-center gap-3">
        <h1 className="neon font-headline text-4xl font-extrabold tracking-tight sm:text-5xl">
          Quizmo
        </h1>
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          className="tap-target rounded-full bg-white/5 text-white/50 transition-colors hover:bg-white/15 hover:text-white"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Game mode badge */}
      {gameMode !== "classic" && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold ${
          gameMode === "elimination"
            ? "bg-red-500/20 text-white"
            : "bg-blue-500/20 text-blue-300"
        }`}>
          {gameMode === "elimination" ? <Skull className="h-4 w-4" /> : <Users className="h-4 w-4" />}
          {gameMode === "elimination" ? t("lobby.elimination") : `${t("lobby.team")} (${teamNames.length} ${t("lobby.teams")})`}
        </div>
      )}

      <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-start sm:gap-10 lg:gap-14">
        {/* Left: code + QR */}
        <div className="flex flex-col items-center gap-4">
          <RoomCodeDisplay code={code} />
          {joinUrl && (
            <div className="surface rounded-3xl p-3">
              <div className="overflow-hidden rounded-2xl bg-white p-2.5">
                <QRCodeComponent url={joinUrl} size={196} />
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
            <QrCode className="h-3.5 w-3.5" />
            <span>{t("lobby.scanQR")}</span>
          </div>
          {/* The raw URL used to be printed here at 12px / 30% opacity —
              unreadable from across a room and redundant with the QR code and
              the big room code above it. Kept for screen readers and
              copy/paste, hidden from the projected view. */}
          {joinUrl && <p className="sr-only">{joinUrl}</p>}
        </div>

        {/* Right: player list */}
        <div className="surface flex w-full flex-col gap-4 rounded-3xl p-6 sm:min-w-[300px] sm:max-w-[340px]">
          <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white/55">
            <Users className="h-5 w-5" />
            <span>{t("lobby.players")} ({players.length})</span>
          </div>

          {players.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-white/40">
              <div className="relative">
                <Users className="h-8 w-8" />
                <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff9062] opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#ff9062]" />
                </span>
              </div>
              <p className="font-bold">{t("lobby.waitingForPlayers")}</p>
              <p className="text-xs text-white/30">Scan the code to join</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col items-center gap-1 animate-bounce-in w-16 sm:w-20"
                >
                  <div className="rounded-full bg-white/5 p-1">
                    <Avatar value={p.emoji} size={40} />
                  </div>
                  <span className={`w-full text-center font-extrabold text-white leading-tight break-words ${
                    p.name.length > 8 ? "text-[10px]" : "text-xs"
                  }`}>{p.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* The Start button animates in with player #1 rather than sitting
              there greyed out. Until then the QR code is the only thing on
              screen worth looking at, which is the point. */}
          {players.length > 0 && (
            <button
              onClick={onStart}
              className="btn-primary animate-fade-in-up flex min-h-[56px] w-full items-center justify-center gap-2 !px-10 !text-xl"
            >
              <Play className="h-6 w-6" />
              {t("lobby.start")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
