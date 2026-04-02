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
  const [muted, setMuted] = useState(false);
  const { playLobby, stopLobby } = useSound();
  const { t } = useTranslation();

  useEffect(() => {
    playLobby();
    return () => stopLobby();
  }, [playLobby, stopLobby]);

  const toggleMute = () => {
    if (muted) {
      playLobby();
    } else {
      stopLobby();
    }
    setMuted(!muted);
  };

  useEffect(() => {
    fetch("/api/network-url")
      .then((r) => r.json())
      .then((data) => setJoinUrl(`${data.url}/play?code=${code}`))
      .catch(() => {
        setJoinUrl(`${window.location.origin}/play?code=${code}`);
      });
  }, [code]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Quizmo
        </h1>
        <button
          onClick={toggleMute}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
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

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-12">
        {/* Left: code + QR */}
        <div className="flex flex-col items-center gap-4">
          <RoomCodeDisplay code={code} />
          {joinUrl && <QRCodeComponent url={joinUrl} size={200} />}
          <div className="flex items-center gap-1.5 text-sm text-white/40">
            <QrCode className="h-3.5 w-3.5" />
            <span>{t("lobby.scanQR")}</span>
          </div>
          {joinUrl && (
            <p className="max-w-xs break-all text-center font-mono text-xs text-white/30">
              {joinUrl}
            </p>
          )}
        </div>

        {/* Right: player list */}
        <div className="flex w-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:min-w-[260px]">
          <div className="flex items-center justify-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white/60">
            <Users className="h-5 w-5" />
            <span>{t("lobby.players")} ({players.length})</span>
          </div>

          {players.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-white/40">
              <Users className="h-8 w-8" />
              <p className="font-bold">{t("lobby.waitingForPlayers")}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col items-center gap-1.5 animate-bounce-in"
                >
                  <div className="rounded-full bg-white/5 p-1">
                    <Avatar value={p.emoji} size={48} />
                  </div>
                  <span className="max-w-[80px] text-center text-sm font-extrabold text-white truncate">{p.name}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onStart}
            disabled={players.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white text-[#ff9062] px-10 py-4 text-xl font-bold transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            <Play className="h-6 w-6" />
            {t("lobby.start")}
          </button>
        </div>
      </div>
    </div>
  );
}
