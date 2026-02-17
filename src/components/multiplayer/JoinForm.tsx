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
        <label className="mb-1.5 block text-sm text-amber-200/60">
          Kambario kodas
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX"
          maxLength={4}
          className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-center text-2xl font-bold uppercase tracking-widest text-amber-50 placeholder:text-white/20 focus:border-amber-400/50 focus:outline-none"
          autoFocus={!initialCode}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-amber-200/60">
          Tavo vardas
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pvz., Jonas"
          maxLength={20}
          className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-lg text-amber-50 placeholder:text-white/20 focus:border-amber-400/50 focus:outline-none"
          autoFocus={!!initialCode}
        />
      </div>

      {/* Emoji picker */}
      <div>
        <label className="mb-1.5 block text-sm text-amber-200/60">
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
                  ? "bg-amber-400/20 ring-2 ring-amber-400 scale-110"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!code.trim() || !name.trim() || loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-lg font-semibold text-amber-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
      >
        <LogIn className="h-5 w-5" />
        {loading ? "Jungiamasi..." : "Prisijungti"}
      </button>
    </form>
  );
}
