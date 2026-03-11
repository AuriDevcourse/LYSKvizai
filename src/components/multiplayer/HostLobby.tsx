"use client";

import { useEffect, useState } from "react";
import { Users, Play, QrCode, Swords, Skull } from "lucide-react";
import type { PlayerInfo, GameMode } from "@/lib/multiplayer/types";
import { useSound } from "@/hooks/useSound";
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
  const { playLobby, stopLobby } = useSound();

  useEffect(() => {
    playLobby();
    return () => stopLobby();
  }, [playLobby, stopLobby]);

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
      <h1 className="text-3xl font-bold text-white sm:text-4xl">
        Quizmo
      </h1>

      {/* Game mode badge */}
      {gameMode !== "classic" && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold ${
          gameMode === "elimination"
            ? "bg-red-500/20 text-white"
            : "bg-blue-500/20 text-blue-300"
        }`}>
          {gameMode === "elimination" ? <Skull className="h-4 w-4" /> : <Users className="h-4 w-4" />}
          {gameMode === "elimination" ? "Elimination" : `Team (${teamNames.length} teams)`}
        </div>
      )}

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-12">
        {/* Left: code + QR */}
        <div className="flex flex-col items-center gap-4">
          <RoomCodeDisplay code={code} />
          {joinUrl && <QRCodeComponent url={joinUrl} size={200} />}
          <div className="flex items-center gap-1.5 text-sm text-white/40">
            <QrCode className="h-3.5 w-3.5" />
            <span>Scan QR or enter code</span>
          </div>
          {joinUrl && (
            <p className="max-w-xs break-all text-center font-mono text-xs text-white/30">
              {joinUrl}
            </p>
          )}
        </div>

        {/* Right: player list */}
        <div className="flex min-w-[240px] flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-sm uppercase tracking-wider text-white/50">
            <Users className="h-4 w-4" />
            <span>Players ({players.length})</span>
          </div>

          {players.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-white/30">
              <Users className="h-8 w-8" />
              <p>Waiting for players...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 rounded-lg bg-white/10 px-4 py-2"
                >
                  <Avatar value={p.emoji} size={32} />
                  <span className="font-medium text-white">{p.name}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onStart}
            disabled={players.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white text-[#46178f] px-10 py-4 text-xl font-bold transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            <Play className="h-6 w-6" />
            Start!
          </button>
        </div>
      </div>
    </div>
  );
}
