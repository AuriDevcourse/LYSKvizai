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

const SVG_AVATARS = [
  "green-hair-white-female.svg",
  "hippie-braids-asian-female.svg",
  "punk-asian-female.svg",
  "punk-asian-male.svg",
  "punk-black-female.svg",
  "punk-black-male.svg",
  "punk-girl-nosering-tanktop.svg",
  "punk-goth-emo-woman-african.svg",
  "punk-goth-emo-woman-asian.svg",
  "punk-goth-emo-woman-caucasian.svg",
  "punk-white-female.svg",
  "punk-white-male.svg",
  "young-hippies-asian-female.svg",
  "young-hippies-asian-male.svg",
  "young-hippies-black-female.svg",
  "young-hippies-black-male.svg",
  "young-hippies-white-female.svg",
  "young-hippies-white-male.svg",
  "old-hippies-asian-female.svg",
  "old-hippies-asian-male.svg",
  "old-hippies-black-female.svg",
  "old-hippies-black-male.svg",
  "old-hippies-white-female.svg",
  "old-hippies-white-male.svg",
  "avatar-pirate-beard-man-african.svg",
  "avatar-pirate-beard-man-asian.svg",
  "avatar-pirate-beard-man-caucasian.svg",
  "avatar-pirate-man-african.svg",
  "avatar-pirate-man-asian.svg",
  "avatar-pirate-man-caucasian.svg",
  "avatar-pirate-woman-african.svg",
  "avatar-pirate-woman-asian.svg",
  "avatar-pirate-woman-caucasian.svg",
  "avatar-doctor-asian-female-coronavirus.svg",
  "avatar-doctor-asian-male-coronavirus.svg",
  "avatar-doctor-black-female-coronavirus.svg",
  "avatar-doctor-black-male-coronavirus.svg",
  "avatar-doctor-white-female-coronavirus.svg",
  "avatar-doctor-white-male-coronavirus.svg",
  "avatar-ems-asian-female-coronavirus.svg",
  "avatar-ems-asian-male-coronavirus.svg",
  "avatar-ems-black-female-coronavirus.svg",
  "avatar-ems-black-male-coronavirus.svg",
  "avatar-ems-white-female-coronavirus.svg",
  "avatar-ems-white-male-coronavirus.svg",
  "avatar-firefighter-asian-female-coronavirus.svg",
  "avatar-firefighter-asian-male-coronavirus.svg",
  "avatar-firefighter-black-female-coronavirus.svg",
  "avatar-firefighter-black-male-coronavirus.svg",
  "avatar-firefighter-white-female-coronavirus.svg",
  "avatar-firefighter-white-male-coronavirus.svg",
  "avatar-nurse-asian-female-coronavirus.svg",
  "avatar-nurse-asian-male-coronavirus.svg",
  "avatar-nurse-black-female-coronavirus.svg",
  "avatar-nurse-black-male-coronavirus.svg",
  "avatar-nurse-white-female-coronavirus.svg",
  "avatar-nurse-white-male-coronavirus.svg",
  "avatar-pharmacist-asian-female-coronavirus.svg",
  "avatar-pharmacist-asian-male-coronavirus.svg",
  "avatar-pharmacist-black-female-coronavirus.svg",
  "avatar-pharmacist-black-male-coronavirus.svg",
  "avatar-pharmacist-white-female-coronavirus.svg",
  "avatar-pharmacist-white-male-coronavirus.svg",
  "avatar-police-asian-female-coronavirus.svg",
  "avatar-police-asian-male-coronavirus.svg",
  "avatar-police-black-female-coronavirus.svg",
  "avatar-police-black-male-coronavirus.svg",
  "avatar-police-white-female-coronavirus.svg",
  "avatar-police-white-male-coronavirus.svg",
  "avatar-pulmonologist-african-female-coronavirus.svg",
  "avatar-pulmonologist-asian-female-coronavirus.svg",
  "avatar-pulmonologist-asian-male-coronavirus.svg",
  "avatar-pulmonologist-black-male-coronavirus.svg",
  "avatar-pulmonologist-white-female-coronavirus.svg",
  "avatar-pulmonologist-white-male-coronavirus.svg",
  "avatar-surgeon-asian-female-coronavirus.svg",
  "avatar-surgeon-asian-male-coronavirus.svg",
  "avatar-surgeon-black-female-coronavirus.svg",
  "avatar-surgeon-black-male-coronavirus.svg",
  "avatar-surgeon-white-female-coronavirus.svg",
  "avatar-surgeon-white-male-coronavirus.svg",
  "avatar-virologist-asian-female-coronavirus.svg",
  "avatar-virologist-asian-male-coronavirus.svg",
  "avatar-virologist-black-female-coronavirus.svg",
  "avatar-virologist-black-male-coronavirus.svg",
  "avatar-virologist-white-female-coronavirus.svg",
  "avatar-virologist-white-male-coronavirus.svg",
];

interface AvatarBuilderProps {
  onChange: (encoded: string) => void;
  initial?: AvatarConfig;
}

type Mode = "builder" | "portraits";
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
  const [mode, setMode] = useState<Mode>("builder");
  const [selectedSvg, setSelectedSvg] = useState("");

  const update = (partial: Partial<AvatarConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    onChange(encodeAvatar(next));
  };

  // Fire initial value
  useState(() => {
    onChange(encodeAvatar(config));
  });

  const selectPortrait = (svg: string) => {
    setSelectedSvg(svg);
    onChange(svg);
  };

  const switchToBuilder = () => {
    setMode("builder");
    setSelectedSvg("");
    onChange(encodeAvatar(config));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mode switcher */}
      <div className="flex w-full rounded-xl bg-white/5 p-1">
        <button
          type="button"
          onClick={switchToBuilder}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            mode === "builder"
              ? "bg-white text-[#46178f]"
              : "text-white/60 hover:text-white"
          }`}
        >
          Sukurk
        </button>
        <button
          type="button"
          onClick={() => setMode("portraits")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            mode === "portraits"
              ? "bg-white text-[#46178f]"
              : "text-white/60 hover:text-white"
          }`}
        >
          Portretai
        </button>
      </div>

      {mode === "portraits" ? (
        <>
          {/* Portrait preview */}
          <div className="flex items-center justify-center rounded-2xl bg-white/10 p-3">
            {selectedSvg ? (
              <Avatar value={selectedSvg} size={80} />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center text-sm font-bold text-white/30">
                Pasirink
              </div>
            )}
          </div>

          {/* Portrait grid */}
          <div className="grid w-full grid-cols-5 gap-2 max-h-48 overflow-y-auto rounded-lg p-1">
            {SVG_AVATARS.map((svg) => (
              <button
                key={svg}
                type="button"
                onClick={() => selectPortrait(svg)}
                className={`flex items-center justify-center rounded-xl p-1.5 transition-all ${
                  selectedSvg === svg
                    ? "bg-white/20 ring-2 ring-white scale-105"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <Avatar value={svg} size={44} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Builder preview */}
          <div className="flex items-center justify-center rounded-2xl bg-white/10 p-3">
            <Avatar value={encodeAvatar(config)} size={80} />
          </div>

          {/* Builder tabs */}
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

          {/* Builder options */}
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
        </>
      )}
    </div>
  );
}
