"use client";

import { useState, useEffect, useMemo } from "react";
import { Dices } from "lucide-react";
import Avatar from "./Avatar";
import {
  type DiceBearConfig,
  DEFAULT_CONFIG,
  encode,
  randomConfig,
  rerollCategory,
  setFeature,
  variantCount,
  backgroundCount,
  skinCount,
  hairColorCount,
} from "@/lib/avatar-dicebear";

interface AvatarBuilderProps {
  onChange: (encoded: string) => void;
}

type Tab = "hair" | "hairColor" | "eyes" | "eyebrows" | "mouth" | "skin" | "glasses" | "earrings" | "features" | "bg";

const TABS: { id: Tab; label: string }[] = [
  { id: "hair", label: "Hair" },
  { id: "hairColor", label: "Hair color" },
  { id: "skin", label: "Skin" },
  { id: "eyes", label: "Eyes" },
  { id: "eyebrows", label: "Brows" },
  { id: "mouth", label: "Mouth" },
  { id: "glasses", label: "Glasses" },
  { id: "earrings", label: "Earrings" },
  { id: "features", label: "Features" },
  { id: "bg", label: "Background" },
];

/** Build a preview config with one feature swapped. For optional categories
 *  (glasses/earrings/features) option 0 is the "none" tile. */
function withFeature(base: DiceBearConfig, cat: Tab, idx: number): DiceBearConfig {
  if (cat === "bg" || cat === "skin" || cat === "hairColor") return setFeature(base, cat, idx);
  const isOptional = cat === "glasses" || cat === "earrings" || cat === "features";
  if (isOptional) {
    if (idx === 0) return { ...base, [cat]: -1 };
    return setFeature(base, cat, idx - 1);
  }
  return setFeature(base, cat, idx);
}

function optionCount(cat: Tab): number {
  if (cat === "bg") return backgroundCount();
  if (cat === "skin") return skinCount();
  if (cat === "hairColor") return hairColorCount();
  if (cat === "glasses" || cat === "earrings" || cat === "features") {
    return variantCount(cat) + 1;
  }
  return variantCount(cat);
}

function isSelected(cat: Tab, idx: number, c: DiceBearConfig): boolean {
  if (cat === "bg") return c.bg === idx;
  if (cat === "skin") return c.skin === idx;
  if (cat === "hairColor") return c.hairColor === idx;
  if (cat === "glasses") return idx === 0 ? c.glasses === -1 : c.glasses === idx - 1;
  if (cat === "earrings") return idx === 0 ? c.earrings === -1 : c.earrings === idx - 1;
  if (cat === "features") return idx === 0 ? c.features === -1 : c.features === idx - 1;
  return c[cat] === idx;
}

export default function AvatarBuilder({ onChange }: AvatarBuilderProps) {
  const [config, setConfig] = useState<DiceBearConfig>(DEFAULT_CONFIG);
  const [tab, setTab] = useState<Tab>("hair");

  useEffect(() => {
    const rand = randomConfig();
    setConfig(rand);
    onChange(encode(rand));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const encoded = useMemo(() => encode(config), [config]);

  const randomize = () => {
    const next = randomConfig();
    setConfig(next);
    onChange(encode(next));
  };

  const pickOption = (cat: Tab, idx: number) => {
    const next = withFeature(config, cat, idx);
    setConfig(next);
    onChange(encode(next));
  };

  const rerollCurrent = () => {
    const next = rerollCategory(config, tab);
    setConfig(next);
    onChange(encode(next));
  };

  const activeLabel = TABS.find((t) => t.id === tab)?.label.toLowerCase() ?? "";

  return (
    <div className="flex flex-col gap-3">
      {/* Preview + dice controls */}
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/5 p-1">
          <Avatar value={encoded} size={72} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <button
            type="button"
            onClick={randomize}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/8 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-white/15 active:scale-95"
          >
            <Dices className="h-4 w-4" />
            Randomize all
          </button>
          <button
            type="button"
            onClick={rerollCurrent}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-[11px] font-bold text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <Dices className="h-3.5 w-3.5" />
            Re-roll {activeLabel}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
              tab === t.id
                ? "bg-[#ff9062] text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Option grid */}
      <div className="grid max-h-56 grid-cols-4 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-5">
        {Array.from({ length: optionCount(tab) }, (_, i) => {
          const preview = withFeature(config, tab, i);
          const selected = isSelected(tab, i, config);
          return (
            <button
              key={i}
              type="button"
              onClick={() => pickOption(tab, i)}
              className={`flex aspect-square items-center justify-center rounded-xl p-1 transition-all ${
                selected
                  ? "bg-white/15 outline outline-[1.5px] outline-[#ff9062]"
                  : "bg-white/5 hover:bg-white/10"
              }`}
              aria-label={`${tab} option ${i + 1}`}
            >
              <Avatar value={encode(preview)} size={40} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
