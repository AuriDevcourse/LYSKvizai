"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

const AVATAR_EMOJIS = [
  "🎭", "🔥", "🥞", "🐻", "🐐", "🦊", "🐔", "🎪",
  "🌸", "❄️", "⚡", "🎵", "🍯", "🎯", "🌊", "🦉",
];

interface JoinFormProps {
  initialCode?: string;
  onJoin: (code: string, name: string, emoji: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function JoinForm({ initialCode, onJoin, loading, error }: JoinFormProps) {
  const [code, setCode] = useState(initialCode ?? "");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(
    () => AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    onJoin(code.trim().toUpperCase(), name.trim(), emoji);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm text-white/60">
          Kambario kodas
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX"
          maxLength={4}
          className="w-full rounded-xl border-2 border-white/15 bg-white/5 px-4 py-3 text-center text-2xl font-bold uppercase tracking-widest text-white placeholder:text-white/20 focus:border-white/35 focus:outline-none"
          autoFocus={!initialCode}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-white/60">
          Tavo vardas
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pvz., Jonas"
          maxLength={20}
          className="w-full rounded-xl border-2 border-white/15 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-white/20 focus:border-white/35 focus:outline-none"
          autoFocus={!!initialCode}
        />
      </div>

      {/* Emoji picker */}
      <div>
        <label className="mb-1.5 block text-sm text-white/60">
          Pasirink avatarą
        </label>
        <div className="grid grid-cols-8 gap-1.5">
          {AVATAR_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex h-10 w-full items-center justify-center rounded-lg text-xl transition-all ${
                emoji === e
                  ? "bg-white/20 ring-2 ring-white scale-110"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-[#e21b3c]/20 px-3 py-2 text-sm text-white">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!code.trim() || !name.trim() || loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-white text-[#46178f] px-6 py-3.5 text-lg font-bold transition-colors hover:bg-white/90 disabled:opacity-50"
      >
        <LogIn className="h-5 w-5" />
        {loading ? "Jungiamasi..." : "Prisijungti"}
      </button>
    </form>
  );
}
