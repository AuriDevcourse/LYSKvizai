"use client";

import { useState, useMemo } from "react";
import Avatar, {
  ANIMALS,
  COLORS,
  HATS,
  ACCESSORIES,
  encodeAvatar,
  type AvatarConfig,
} from "./Avatar";

// --- SVG portrait data ---

const ALL_PORTRAITS = [
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

const SKIN_TOKENS = ["asian", "black", "white", "african", "caucasian"] as const;

const SKIN_COLORS = [
  { id: "light", tokens: ["white", "caucasian"], label: "Light", swatch: "#f5d0a9" },
  { id: "medium", tokens: ["asian"], label: "Medium", swatch: "#c68642" },
  { id: "dark", tokens: ["black", "african"], label: "Dark", swatch: "#8d5524" },
];

interface AvatarGroup {
  base: string;           // group key (filename without skin token)
  label: string;          // display name
  variants: { skin: string; file: string }[];
  defaultFile: string;    // first variant filename
}

function buildGroups(): AvatarGroup[] {
  const groupMap = new Map<string, { skin: string; file: string }[]>();

  for (const file of ALL_PORTRAITS) {
    const name = file.replace(".svg", "").replace("avatar-", "").replace("-coronavirus", "");
    const parts = name.split("-");

    // Find skin token
    let skinToken: string | null = null;
    let skinIdx = -1;
    for (let i = 0; i < parts.length; i++) {
      if ((SKIN_TOKENS as readonly string[]).includes(parts[i])) {
        skinToken = parts[i];
        skinIdx = i;
        break;
      }
    }

    let base: string;
    if (skinToken !== null && skinIdx >= 0) {
      const baseParts = [...parts];
      baseParts.splice(skinIdx, 1);
      base = baseParts.join("-");
    } else {
      base = name;
      skinToken = "unique";
    }

    if (!groupMap.has(base)) groupMap.set(base, []);
    groupMap.get(base)!.push({ skin: skinToken, file });
  }

  const groups: AvatarGroup[] = [];
  for (const [base, variants] of groupMap) {
    // Pretty label from base
    const label = base
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    groups.push({
      base,
      label,
      variants,
      defaultFile: variants[0].file,
    });
  }
  return groups;
}

const BG_COLORS = [
  "#46178f", "#e21b3c", "#1368ce", "#26890c", "#d89e00",
  "#7b2ff2", "#e84393", "#00b894", "#e17055", "#0ea5e9",
  "#6c5ce7", "#fdcb6e",
];

// --- Component ---

interface AvatarBuilderProps {
  onChange: (encoded: string) => void;
  initial?: AvatarConfig;
}

type Mode = "builder" | "portraits";
type Tab = "animal" | "color" | "hat" | "accessory";

const TABS: { id: Tab; label: string }[] = [
  { id: "animal", label: "Animal" },
  { id: "color", label: "Color" },
  { id: "hat", label: "Hat" },
  { id: "accessory", label: "Acc." },
];

export default function AvatarBuilder({ onChange, initial }: AvatarBuilderProps) {
  const groups = useMemo(() => buildGroups(), []);

  const [config, setConfig] = useState<AvatarConfig>(
    initial ?? {
      animal: ANIMALS[Math.floor(Math.random() * ANIMALS.length)].id,
      color: COLORS[Math.floor(Math.random() * COLORS.length)].id,
      hat: "none",
      accessory: "none",
    }
  );
  const [tab, setTab] = useState<Tab>("animal");
  const [mode, setMode] = useState<Mode>("portraits");

  // Portrait state
  const [selectedGroup, setSelectedGroup] = useState<AvatarGroup | null>(null);
  const [selectedFile, setSelectedFile] = useState("");
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);

  const update = (partial: Partial<AvatarConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    onChange(encodeAvatar(next));
  };

  // Fire initial value
  useState(() => {
    onChange(encodeAvatar(config));
  });

  const encodeSvgAvatar = (file: string, bg: string) => `svg:${file}:${bg}`;

  const selectGroup = (group: AvatarGroup) => {
    setSelectedGroup(group);
    // Pick first variant
    const file = group.defaultFile;
    setSelectedFile(file);
    onChange(encodeSvgAvatar(file, bgColor));
  };

  const selectSkin = (file: string) => {
    setSelectedFile(file);
    onChange(encodeSvgAvatar(file, bgColor));
  };

  const selectBgColor = (color: string) => {
    setBgColor(color);
    if (selectedFile) {
      onChange(encodeSvgAvatar(selectedFile, color));
    }
  };

  const switchToBuilder = () => {
    setMode("builder");
    setSelectedGroup(null);
    setSelectedFile("");
    onChange(encodeAvatar(config));
  };

  const currentPreview = mode === "portraits" && selectedFile
    ? encodeSvgAvatar(selectedFile, bgColor)
    : encodeAvatar(config);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mode switcher */}
      <div className="flex w-full rounded-xl bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setMode("portraits")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            mode === "portraits"
              ? "bg-white text-[#46178f]"
              : "text-white/60 hover:text-white"
          }`}
        >
          Portraits
        </button>
        <button
          type="button"
          onClick={switchToBuilder}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            mode === "builder"
              ? "bg-white text-[#46178f]"
              : "text-white/60 hover:text-white"
          }`}
        >
          Create
        </button>
      </div>

      {/* Preview */}
      <div className="flex items-center justify-center rounded-2xl bg-white/10 p-3">
        <Avatar value={currentPreview} size={80} />
      </div>

      {mode === "portraits" ? (
        <div className="flex w-full flex-col gap-3">
          {/* Background color picker */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Background</p>
            <div className="flex flex-wrap gap-1.5">
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => selectBgColor(c)}
                  className={`h-7 w-7 rounded-full transition-all ${
                    bgColor === c ? "ring-2 ring-white scale-110" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Skin tone picker (only when a group with variants is selected) */}
          {selectedGroup && selectedGroup.variants.length > 1 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Skin tone</p>
              <div className="flex gap-2">
                {SKIN_COLORS.map((sc) => {
                  const match = selectedGroup.variants.find((v) =>
                    sc.tokens.includes(v.skin)
                  );
                  if (!match) return null;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => selectSkin(match.file)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        selectedFile === match.file
                          ? "border-white scale-110"
                          : "border-transparent hover:scale-110"
                      }`}
                      style={{ backgroundColor: sc.swatch }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Character grid */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Character</p>
            <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto rounded-lg pr-1">
              {groups.map((group) => {
                const isSelected = selectedGroup?.base === group.base;
                const previewFile = isSelected && selectedFile
                  ? selectedFile
                  : group.defaultFile;
                return (
                  <button
                    key={group.base}
                    type="button"
                    onClick={() => selectGroup(group)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-1.5 transition-all ${
                      isSelected
                        ? "bg-white/20 ring-2 ring-white"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <Avatar value={encodeSvgAvatar(previewFile, bgColor)} size={44} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
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
