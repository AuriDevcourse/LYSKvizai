"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import AvatarBuilder from "@/components/AvatarBuilder";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface JoinFormProps {
  initialCode?: string;
  onJoin: (code: string, name: string, emoji: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function JoinForm({ initialCode, onJoin, loading, error }: JoinFormProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState(initialCode ?? "");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    onJoin(code.trim().toUpperCase(), name.trim(), avatar);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-bold text-white/60">
          {t("joinForm.roomCode")}
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXXX"
          maxLength={5}
          className="w-full rounded-xl border-2 border-white/15 bg-white/5 px-4 py-3 text-center text-2xl font-bold uppercase tracking-widest text-white placeholder:text-white/20 focus:border-white/35 focus:outline-none"
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
          className="w-full rounded-xl border-2 border-white/15 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-white/20 focus:border-white/35 focus:outline-none"
        />
      </div>

      {/* Avatar builder */}
      <div>
        <label className="mb-1.5 block text-sm font-bold text-white/60">
          {t("joinForm.avatar")}
        </label>
        <AvatarBuilder onChange={setAvatar} />
      </div>

      {error && (
        <p className="rounded-lg bg-[#e21b3c]/20 px-3 py-2 text-sm font-bold text-white">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!code.trim() || !name.trim() || loading}
        className="btn-primary flex items-center justify-center gap-2 w-full disabled:opacity-50"
      >
        <LogIn className="h-5 w-5" />
        {loading ? t("joinForm.joining") : t("joinForm.join")}
      </button>
    </form>
  );
}
