"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LogIn } from "lucide-react";
/**
 * Loaded on demand.
 *
 * The avatar picker pulls in the DiceBear engine, and `/play` used to import it
 * statically — so anyone tapping "Create game", who never sees a picker at
 * all, paid for the whole engine up front. `next/dynamic` moves it into its own
 * chunk fetched when the picker is actually rendered.
 */
const AvatarBuilder = dynamic(() => import("@/components/AvatarBuilder"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-xl bg-white/5" />,
});
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface JoinFormProps {
  initialCode?: string;
  onJoin: (code: string, name: string, emoji: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function JoinForm({ initialCode, onJoin, loading, error }: JoinFormProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState(() => (initialCode ?? "").toUpperCase());
  const [lastInitial, setLastInitial] = useState(initialCode);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  if (initialCode !== lastInitial) {
    setLastInitial(initialCode);
    if (initialCode) setCode(initialCode.toUpperCase());
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    onJoin(code.trim().toUpperCase(), name.trim(), avatar);
  };

  /**
   * The first unmet requirement, in the order the form presents them, or
   * `null` when the player can join.
   */
  const missing =
    !code.trim() ? "Enter the room code" :
    !name.trim() ? "Enter your name" :
    !avatar ? "Pick an avatar to join" :
    null;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-bold text-white/60">
          {t("joinForm.roomCode")}
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX"
          maxLength={4}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="next"
          aria-label="Room code"
          // A join failure is nearly always the code, so point the field at
          // the message and mark it invalid — otherwise the error is announced
          // once and then orphaned from the thing that caused it.
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "join-error" : undefined}
          className="min-h-[56px] w-full rounded-xl border-[1.5px] border-white/8 bg-white/5 px-4 py-3 text-center text-2xl font-bold uppercase tracking-widest text-white placeholder:text-white/20 focus:border-white/35 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-bold text-white/60">
          {t("joinForm.name")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("joinForm.namePlaceholder")}
          maxLength={16}
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="nickname"
          enterKeyHint="go"
          aria-label="Your name"
          className="min-h-[52px] w-full rounded-xl border-[1.5px] border-white/8 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-white/20 focus:border-white/35 focus:outline-none"
        />
      </div>

      {/* Avatar builder */}
      <div>
        <label className="mb-1.5 block text-sm font-bold text-white/60">
          {t("joinForm.avatar")}
        </label>
        <AvatarBuilder onChange={setAvatar} />
      </div>

      {/* Announced, not just shown. This was a plain paragraph, so a screen
          reader user submitting a wrong room code got no feedback at all —
          focus stayed put and nothing was read out. */}
      {error && (
        <p
          id="join-error"
          role="alert"
          aria-live="assertive"
          className="rounded-lg bg-error/20 px-3 py-2 text-sm font-bold text-white"
        >
          {error}
        </p>
      )}

      {/* Say why the button is dead.
          It greys out until all three are filled, and an avatar is the least
          obvious of them — the builder looks decorative, so a player with
          their code and name typed would sit staring at a disabled button
          with nothing telling them what was missing. */}
      {missing && !loading && (
        <p
          id="join-blocked-reason"
          className="text-center text-xs font-bold text-white/50"
        >
          {missing}
        </p>
      )}

      <button
        type="submit"
        disabled={Boolean(missing) || loading}
        aria-describedby={missing ? "join-blocked-reason" : undefined}
        className="btn-primary flex items-center justify-center gap-2 w-full disabled:opacity-50"
      >
        <LogIn className="h-5 w-5" />
        {loading ? t("joinForm.joining") : t("joinForm.join")}
      </button>
    </form>
  );
}
