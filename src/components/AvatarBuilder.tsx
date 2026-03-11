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

const SKIN_COLORS = [
  { id: "light", tokens: ["white", "caucasian"], swatch: "#f5d0a9" },
  { id: "medium", tokens: ["asian"], swatch: "#c68642" },
  { id: "dark", tokens: ["black", "african"], swatch: "#8d5524" },
];

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

const BG_COLORS = [
  "#46178f", "#e21b3c", "#1368ce", "#26890c", "#d89e00",
  "#7b2ff2", "#e84393", "#00b894", "#e17055", "#0ea5e9",
  "#6c5ce7", "#fdcb6e", "#2d3436", "#00cec9", "#ff7675",
  "#a29bfe",
];

// --- Component ---

interface AvatarBuilderProps {
  onChange: (encoded: string) => void;
}

export default function AvatarBuilder({ onChange }: AvatarBuilderProps) {
  const groups = useMemo(() => buildGroups(), []);

  const [selectedGroup, setSelectedGroup] = useState<AvatarGroup | null>(null);
  const [selectedFile, setSelectedFile] = useState("");
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);

  // Fire initial empty value
  useState(() => {
    onChange("");
  });

  const encode = (file: string, bg: string) => `svg:${file}:${bg}`;

  const selectGroup = (group: AvatarGroup) => {
    setSelectedGroup(group);
    const file = group.defaultFile;
    setSelectedFile(file);
    onChange(encode(file, bgColor));
  };

  const selectSkin = (file: string) => {
    setSelectedFile(file);
    onChange(encode(file, bgColor));
  };

  const selectBgColor = (color: string) => {
    setBgColor(color);
    if (selectedFile) {
      onChange(encode(selectedFile, color));
    }
  };

  const currentPreview = selectedFile ? encode(selectedFile, bgColor) : "";

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

      {/* Background color */}
      <div className="w-full">
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

      {/* Skin tone (when group with variants is selected) */}
      {selectedGroup && selectedGroup.variants.length > 1 && (
        <div className="w-full">
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
                <Avatar value={encode(previewFile, bgColor)} size={44} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
