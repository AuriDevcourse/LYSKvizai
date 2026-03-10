"use client";

import { useState } from "react";
import Avatar, {
  ANIMALS,
  COLORS,
  HATS,
  ACCESSORIES,
  encodeAvatar,
  type AvatarConfig,
} from "./Avatar";

interface AvatarBuilderProps {
  onChange: (encoded: string) => void;
  initial?: AvatarConfig;
}

type Tab = "animal" | "color" | "hat" | "accessory";

const TABS: { id: Tab; label: string }[] = [
  { id: "animal", label: "Gyvūnas" },
  { id: "color", label: "Spalva" },
  { id: "hat", label: "Kepurė" },
  { id: "accessory", label: "Aksesuaras" },
];

export default function AvatarBuilder({ onChange, initial }: AvatarBuilderProps) {
  const [config, setConfig] = useState<AvatarConfig>(
    initial ?? {
      animal: ANIMALS[Math.floor(Math.random() * ANIMALS.length)].id,
      color: COLORS[Math.floor(Math.random() * COLORS.length)].id,
      hat: "none",
      accessory: "none",
    }
  );
  const [tab, setTab] = useState<Tab>("animal");

  const update = (partial: Partial<AvatarConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    onChange(encodeAvatar(next));
  };

  // Fire initial value
  useState(() => {
    onChange(encodeAvatar(config));
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview */}
      <div className="flex items-center justify-center rounded-2xl bg-white/10 p-3">
        <Avatar value={encodeAvatar(config)} size={80} />
      </div>

      {/* Tabs */}
      <div className="flex w-full rounded-xl bg-white/5 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition-all ${
              tab === t.id
                ? "bg-white text-[#46178f]"
                : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="w-full">
        {tab === "animal" && (
          <div className="grid grid-cols-4 gap-2">
            {ANIMALS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => update({ animal: a.id })}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                  config.animal === a.id
                    ? "bg-white/20 ring-2 ring-white"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <Avatar value={encodeAvatar({ ...config, animal: a.id })} size={40} />
                <span className="text-[10px] font-bold text-white/70">{a.label}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "color" && (
          <div className="grid grid-cols-4 gap-2">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => update({ color: c.id })}
                className={`flex items-center justify-center rounded-xl p-3 transition-all ${
                  config.color === c.id
                    ? "ring-2 ring-white scale-105"
                    : "hover:scale-105"
                }`}
              >
                <div
                  className="h-10 w-10 rounded-full"
                  style={{ backgroundColor: c.fill }}
                />
              </button>
            ))}
          </div>
        )}

        {tab === "hat" && (
          <div className="grid grid-cols-4 gap-2">
            {HATS.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => update({ hat: h.id })}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                  config.hat === h.id
                    ? "bg-white/20 ring-2 ring-white"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <Avatar value={encodeAvatar({ ...config, hat: h.id })} size={36} />
                <span className="text-[10px] font-bold text-white/70">{h.label}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "accessory" && (
          <div className="grid grid-cols-3 gap-2">
            {ACCESSORIES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => update({ accessory: a.id })}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                  config.accessory === a.id
                    ? "bg-white/20 ring-2 ring-white"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <Avatar value={encodeAvatar({ ...config, accessory: a.id })} size={36} />
                <span className="text-[10px] font-bold text-white/70">{a.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
