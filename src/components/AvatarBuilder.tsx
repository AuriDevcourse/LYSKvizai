"use client";

import { useState, useEffect } from "react";
import { Dices } from "lucide-react";
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
}

type Tab = "animal" | "color" | "hat" | "accessory";

const TABS: { id: Tab; label: string }[] = [
  { id: "animal", label: "Face" },
  { id: "color", label: "Color" },
  { id: "hat", label: "Hat" },
  { id: "accessory", label: "Extra" },
];

function randomConfig(): AvatarConfig {
  return {
    animal: ANIMALS[Math.floor(Math.random() * ANIMALS.length)].id,
    color: COLORS[Math.floor(Math.random() * COLORS.length)].id,
    hat: HATS[Math.floor(Math.random() * HATS.length)].id,
    accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id,
  };
}

const DEFAULT_CONFIG: AvatarConfig = { animal: "bear", color: "red", hat: "none", accessory: "none" };

export default function AvatarBuilder({ onChange }: AvatarBuilderProps) {
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_CONFIG);
  const [tab, setTab] = useState<Tab>("animal");

  // Randomize on mount (client only) to avoid hydration mismatch
  useEffect(() => {
    const rand = randomConfig();
    setConfig(rand);
    onChange(encodeAvatar(rand));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (patch: Partial<AvatarConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    onChange(encodeAvatar(next));
  };

  const randomize = () => {
    const next = randomConfig();
    setConfig(next);
    onChange(encodeAvatar(next));
  };

  return (
    <div className="flex gap-4">
      {/* Left: preview + dice */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="flex items-center justify-center rounded-2xl bg-white/5 p-2">
          <Avatar value={encodeAvatar(config)} size={72} />
        </div>
        <button
          type="button"
          onClick={randomize}
          className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60 transition-all hover:bg-white/20 hover:text-white active:scale-95"
        >
          <Dices className="h-4 w-4" />
        </button>
      </div>

      {/* Right: tabs + options */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {/* Tabs */}
        <div className="flex rounded-xl bg-white/5 p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-1.5 py-1.5 text-[11px] font-bold transition-all ${
                tab === t.id
                  ? "bg-white text-[#ff9062]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "animal" && (
          <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
            {ANIMALS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => update({ animal: a.id })}
                className={`flex items-center justify-center rounded-xl p-1.5 transition-all ${
                  config.animal === a.id
                    ? "bg-white/20 outline outline-[1.5px] outline-[#ff9062]"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <Avatar value={encodeAvatar({ ...config, animal: a.id })} size={36} />
              </button>
            ))}
          </div>
        )}

        {tab === "color" && (
          <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-0.5">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => update({ color: c.id })}
                className={`h-10 rounded-xl transition-all ${
                  config.color === c.id
                    ? "outline outline-[1.5px] outline-[#ff9062] scale-105"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: c.fill }}
              />
            ))}
          </div>
        )}

        {tab === "hat" && (
          <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
            {HATS.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => update({ hat: h.id })}
                className={`flex items-center justify-center rounded-xl p-1.5 transition-all ${
                  config.hat === h.id
                    ? "bg-white/20 outline outline-[1.5px] outline-[#ff9062]"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <Avatar value={encodeAvatar({ ...config, hat: h.id })} size={36} />
              </button>
            ))}
          </div>
        )}

        {tab === "accessory" && (
          <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
            {ACCESSORIES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => update({ accessory: a.id })}
                className={`flex items-center justify-center rounded-xl p-1.5 transition-all ${
                  config.accessory === a.id
                    ? "bg-white/20 outline outline-[1.5px] outline-[#ff9062]"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <Avatar value={encodeAvatar({ ...config, accessory: a.id })} size={36} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
