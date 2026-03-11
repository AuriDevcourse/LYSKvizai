"use client";

import { useState, useMemo } from "react";
import Avatar from "./Avatar";

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

interface AvatarGroup {
  base: string;
  variants: { skin: string; file: string }[];
  defaultFile: string;
}

function buildGroups(): AvatarGroup[] {
  const groupMap = new Map<string, { skin: string; file: string }[]>();

  for (const file of ALL_PORTRAITS) {
    const name = file.replace(".svg", "").replace("avatar-", "").replace("-coronavirus", "");
    const parts = name.split("-");

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
    groups.push({ base, variants, defaultFile: variants[0].file });
  }
  return groups;
}

// 20 skin / tint colors — fun, not realistic
const SKIN_PALETTE = [
  "", // none (original)
  "#f5d0a9", "#c68642", "#8d5524",
  "#e21b3c", "#ff6b6b", "#e84393", "#fd79a8",
  "#1368ce", "#74b9ff", "#0ea5e9", "#00cec9",
  "#26890c", "#00b894", "#55efc4",
  "#d89e00", "#fdcb6e", "#ffeaa7",
  "#7b2ff2", "#a29bfe",
];

// 20 background colors
const BG_PALETTE = [
  "#46178f", "#7b2ff2", "#6c5ce7", "#a29bfe",
  "#e21b3c", "#ff7675", "#e84393", "#fd79a8",
  "#1368ce", "#0ea5e9", "#74b9ff", "#00cec9",
  "#26890c", "#00b894", "#55efc4", "#badc58",
  "#d89e00", "#fdcb6e", "#e17055", "#2d3436",
];

// --- Component ---

interface AvatarBuilderProps {
  onChange: (encoded: string) => void;
}

export default function AvatarBuilder({ onChange }: AvatarBuilderProps) {
  const groups = useMemo(() => buildGroups(), []);

  const [selectedGroup, setSelectedGroup] = useState<AvatarGroup | null>(null);
  const [selectedFile, setSelectedFile] = useState("");
  const [bgColor, setBgColor] = useState(BG_PALETTE[0]);
  const [tintColor, setTintColor] = useState("");

  useState(() => {
    onChange("");
  });

  const encode = (file: string, bg: string, tint: string) =>
    tint ? `svg:${file}:${bg}:${tint}` : `svg:${file}:${bg}`;

  const emit = (file: string, bg: string, tint: string) => {
    onChange(encode(file, bg, tint));
  };

  const selectGroup = (group: AvatarGroup) => {
    setSelectedGroup(group);
    const file = group.defaultFile;
    setSelectedFile(file);
    emit(file, bgColor, tintColor);
  };

  const selectVariant = (file: string) => {
    setSelectedFile(file);
    emit(file, bgColor, tintColor);
  };

  const selectBg = (color: string) => {
    setBgColor(color);
    if (selectedFile) emit(selectedFile, color, tintColor);
  };

  const selectTint = (color: string) => {
    setTintColor(color);
    if (selectedFile) emit(selectedFile, bgColor, color);
  };

  const currentPreview = selectedFile ? encode(selectedFile, bgColor, tintColor) : "";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Preview */}
      <div className="flex items-center justify-center rounded-2xl bg-white/10 p-3">
        {currentPreview ? (
          <Avatar value={currentPreview} size={80} />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center text-sm font-bold text-white/30">
            Pick one
          </div>
        )}
      </div>

      {/* Skin color */}
      <div className="w-full">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Skin color</p>
        <div className="flex flex-wrap gap-1.5">
          {SKIN_PALETTE.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectTint(c)}
              className={`h-6 w-6 rounded-full transition-all ${
                tintColor === c ? "ring-2 ring-white scale-110" : "hover:scale-105"
              } ${!c ? "bg-gradient-to-br from-white/40 to-white/10 border border-white/20" : ""}`}
              style={c ? { backgroundColor: c } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Background color */}
      <div className="w-full">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Background</p>
        <div className="flex flex-wrap gap-1.5">
          {BG_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => selectBg(c)}
              className={`h-6 w-6 rounded-full transition-all ${
                bgColor === c ? "ring-2 ring-white scale-110" : "hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Variant picker (file-based skin variants) */}
      {selectedGroup && selectedGroup.variants.length > 1 && (
        <div className="w-full">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Variant</p>
          <div className="flex gap-2">
            {selectedGroup.variants.map((v) => (
              <button
                key={v.file}
                type="button"
                onClick={() => selectVariant(v.file)}
                className={`rounded-xl p-1 transition-all ${
                  selectedFile === v.file
                    ? "bg-white/20 ring-2 ring-white"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <Avatar value={encode(v.file, bgColor, tintColor)} size={36} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Character grid */}
      <div className="w-full">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Avatar</p>
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
                className={`flex items-center justify-center rounded-xl p-1.5 transition-all ${
                  isSelected
                    ? "bg-white/20 ring-2 ring-white"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <Avatar value={encode(previewFile, bgColor, tintColor)} size={44} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
