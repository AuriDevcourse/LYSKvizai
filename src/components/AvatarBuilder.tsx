"use client";

import { useState, useMemo } from "react";
import { Dices } from "lucide-react";
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

// 20 background colors (2 rows of 10)
const BG_PALETTE = [
  "#46178f", "#7b2ff2", "#6c5ce7", "#a29bfe", "#e21b3c",
  "#ff7675", "#e84393", "#fd79a8", "#1368ce", "#0ea5e9",
  "#00cec9", "#00b894", "#26890c", "#55efc4", "#badc58",
  "#d89e00", "#fdcb6e", "#e17055", "#f8a5c2", "#2d3436",
];

// --- Component ---

interface AvatarBuilderProps {
  onChange: (encoded: string) => void;
}

type Tab = "character" | "background";

export default function AvatarBuilder({ onChange }: AvatarBuilderProps) {
  const [selectedFile, setSelectedFile] = useState("");
  const [bgColor, setBgColor] = useState(BG_PALETTE[0]);
  const [tab, setTab] = useState<Tab>("character");

  useState(() => {
    onChange("");
  });

  const encode = (file: string, bg: string) => `svg:${file}:${bg}`;

  const emit = (file: string, bg: string) => {
    onChange(encode(file, bg));
  };

  const selectFile = (file: string) => {
    setSelectedFile(file);
    emit(file, bgColor);
  };

  const selectBg = (color: string) => {
    setBgColor(color);
    if (selectedFile) emit(selectedFile, color);
  };

  const randomize = () => {
    const file = ALL_PORTRAITS[Math.floor(Math.random() * ALL_PORTRAITS.length)];
    const bg = BG_PALETTE[Math.floor(Math.random() * BG_PALETTE.length)];
    setSelectedFile(file);
    setBgColor(bg);
    emit(file, bg);
  };

  const currentPreview = selectedFile ? encode(selectedFile, bgColor) : "";

  return (
    <div className="flex gap-4">
      {/* Left: preview + dice */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="flex items-center justify-center rounded-2xl bg-white/10 p-2">
          {currentPreview ? (
            <Avatar value={currentPreview} size={72} />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center text-[10px] font-bold text-white/30">
              Pick
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={randomize}
          className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white/60 transition-all hover:bg-white/20 hover:text-white active:scale-95"
        >
          <Dices className="h-4 w-4" />
        </button>
      </div>

      {/* Right: tabs + content */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {/* Tabs */}
        <div className="flex rounded-xl bg-white/5 p-0.5">
          <button
            type="button"
            onClick={() => setTab("character")}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition-all ${
              tab === "character"
                ? "bg-white text-[#46178f]"
                : "text-white/50 hover:text-white"
            }`}
          >
            Character
          </button>
          <button
            type="button"
            onClick={() => setTab("background")}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition-all ${
              tab === "background"
                ? "bg-white text-[#46178f]"
                : "text-white/50 hover:text-white"
            }`}
          >
            Background
          </button>
        </div>

        {/* Tab content */}
        {tab === "character" && (
          <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
            {ALL_PORTRAITS.map((file) => (
              <button
                key={file}
                type="button"
                onClick={() => selectFile(file)}
                className={`flex items-center justify-center rounded-xl p-1 transition-all ${
                  selectedFile === file
                    ? "bg-white/20 ring-2 ring-white"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <Avatar value={encode(file, bgColor)} size={40} />
              </button>
            ))}
          </div>
        )}

        {tab === "background" && (
          <div className="grid grid-cols-5 gap-2">
            {BG_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectBg(c)}
                className={`aspect-square rounded-full transition-all ${
                  bgColor === c ? "ring-2 ring-white scale-110" : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
