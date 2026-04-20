import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";

// Config encoded as "d2:H:E:M:B:G:Er:F:BG:Sk:Hc" (11 fields).
// -1 for optional features (glasses, earrings, features) means "not shown".
// Decoder accepts 9-field legacy strings too and fills skin/hair color with 0.
// Prefix d2 = adventurer style.

type Category = "hair" | "eyes" | "mouth" | "eyebrows" | "glasses" | "earrings" | "features";

const CATEGORIES: Category[] = ["hair", "eyes", "mouth", "eyebrows", "glasses", "earrings", "features"];

const schemaProps = (adventurer.schema?.properties ?? {}) as Record<
  string,
  { items?: { enum?: string[] }; default?: string[] }
>;
const variants: Record<Category, string[]> = {
  hair: schemaProps.hair?.items?.enum ?? [],
  eyes: schemaProps.eyes?.items?.enum ?? [],
  mouth: schemaProps.mouth?.items?.enum ?? [],
  eyebrows: schemaProps.eyebrows?.items?.enum ?? [],
  glasses: schemaProps.glasses?.items?.enum ?? [],
  earrings: schemaProps.earrings?.items?.enum ?? [],
  features: schemaProps.features?.items?.enum ?? [],
};

// Skin tones — from DiceBear adventurer defaults, reordered light→dark
const SKIN_COLORS = ["f2d3b1", "ecad80", "9e5622", "763900"];

// Hair colors — from DiceBear adventurer defaults
const HAIR_COLORS = [
  "0e0e0e", // black
  "562306", // dark brown
  "6a4e35", // brown
  "796a45", // ash brown
  "ac6511", // chestnut
  "cb6820", // copper
  "ab2a18", // red
  "b9a05f", // dark blonde
  "e5d7a3", // blonde
  "afafaf", // grey
  "3eac2c", // green
  "85c2c6", // teal
  "dba3be", // pink
  "592454", // purple
];

// Backgrounds that play well on #0e0e0e glass panels
const BACKGROUNDS = [
  "transparent",
  "ff9062",
  "43a5fc",
  "e77fff",
  "b2ff59",
  "ffbb59",
  "ff716c",
  "66bb6a",
];

export interface DiceBearConfig {
  hair: number;
  eyes: number;
  mouth: number;
  eyebrows: number;
  glasses: number;   // -1 = no glasses
  earrings: number;  // -1 = no earrings
  features: number;  // -1 = no features (freckles etc.)
  bg: number;
  skin: number;
  hairColor: number;
}

export function variantCount(cat: Category): number {
  return variants[cat].length;
}

export function backgroundCount(): number {
  return BACKGROUNDS.length;
}

export function skinCount(): number {
  return SKIN_COLORS.length;
}

export function skinHex(idx: number): string {
  return SKIN_COLORS[((idx % SKIN_COLORS.length) + SKIN_COLORS.length) % SKIN_COLORS.length];
}

export function hairColorCount(): number {
  return HAIR_COLORS.length;
}

export function hairColorHex(idx: number): string {
  return HAIR_COLORS[((idx % HAIR_COLORS.length) + HAIR_COLORS.length) % HAIR_COLORS.length];
}

export function backgroundColor(idx: number): string {
  return BACKGROUNDS[((idx % BACKGROUNDS.length) + BACKGROUNDS.length) % BACKGROUNDS.length];
}

export function categoryList(): Category[] {
  return CATEGORIES;
}

function clamp(i: number, max: number): number {
  if (max === 0) return 0;
  return ((i % max) + max) % max;
}

export function encode(c: DiceBearConfig): string {
  return [
    "d2",
    c.hair,
    c.eyes,
    c.mouth,
    c.eyebrows,
    c.glasses,
    c.earrings,
    c.features,
    c.bg,
    c.skin,
    c.hairColor,
  ].join(":");
}

export function decode(s: string): DiceBearConfig | null {
  if (!s.startsWith("d2:")) return null;
  const parts = s.split(":");
  // Accept both 9-field (legacy) and 11-field (current) encodings
  if (parts.length !== 9 && parts.length !== 11) return null;
  const nums = parts.slice(1).map((p) => parseInt(p, 10));
  if (nums.some((n) => isNaN(n))) return null;
  return {
    hair: nums[0],
    eyes: nums[1],
    mouth: nums[2],
    eyebrows: nums[3],
    glasses: nums[4],
    earrings: nums[5],
    features: nums[6],
    bg: nums[7],
    skin: nums[8] ?? 0,
    hairColor: nums[9] ?? 0,
  };
}

export const DEFAULT_CONFIG: DiceBearConfig = {
  hair: 0,
  eyes: 0,
  mouth: 0,
  eyebrows: 0,
  glasses: -1,
  earrings: -1,
  features: -1,
  bg: 0,
  skin: 0,
  hairColor: 0,
};

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/** Randomize all features. Skin is deliberately NOT randomized — it's an
 *  identity choice, not a dice roll. First-load gets index 0 as a neutral
 *  default; from there the user picks via the Skin tab. Optional extras
 *  appear at modest rates; hair color is mostly natural, with small chance
 *  of a novelty shade. When `preserveSkin` is passed, that value is kept. */
export function randomConfig(preserveSkin?: number): DiceBearConfig {
  // Indices 0-9 are natural hair shades; 10-13 are novelty colors.
  const hairColor = Math.random() < 0.85 ? randInt(10) : 10 + randInt(Math.max(1, HAIR_COLORS.length - 10));
  return {
    hair: randInt(variants.hair.length),
    eyes: randInt(variants.eyes.length),
    mouth: randInt(variants.mouth.length),
    eyebrows: randInt(variants.eyebrows.length),
    glasses: Math.random() < 0.25 ? randInt(variants.glasses.length) : -1,
    earrings: Math.random() < 0.2 ? randInt(variants.earrings.length) : -1,
    features: Math.random() < 0.3 ? randInt(variants.features.length) : -1,
    bg: randInt(BACKGROUNDS.length),
    skin: preserveSkin ?? 0,
    hairColor,
  };
}

export type PickerCategory = Category | "bg" | "skin" | "hairColor";

export function rerollCategory(c: DiceBearConfig, cat: PickerCategory): DiceBearConfig {
  if (cat === "bg") return { ...c, bg: randInt(BACKGROUNDS.length) };
  if (cat === "skin") return { ...c, skin: randInt(SKIN_COLORS.length) };
  if (cat === "hairColor") return { ...c, hairColor: randInt(HAIR_COLORS.length) };
  const isOptional = cat === "glasses" || cat === "earrings" || cat === "features";
  if (isOptional) {
    if (c[cat] === -1) return { ...c, [cat]: randInt(variants[cat].length) };
    if (Math.random() < 0.25) return { ...c, [cat]: -1 };
    const next = randInt(variants[cat].length);
    return { ...c, [cat]: next === c[cat] ? (next + 1) % variants[cat].length : next };
  }
  const count = variants[cat].length;
  const next = randInt(count);
  return { ...c, [cat]: next === c[cat] ? (next + 1) % count : next };
}

export function setFeature(c: DiceBearConfig, cat: PickerCategory, idx: number): DiceBearConfig {
  if (cat === "bg") return { ...c, bg: clamp(idx, BACKGROUNDS.length) };
  if (cat === "skin") return { ...c, skin: clamp(idx, SKIN_COLORS.length) };
  if (cat === "hairColor") return { ...c, hairColor: clamp(idx, HAIR_COLORS.length) };
  return { ...c, [cat]: clamp(idx, variants[cat].length) };
}

export function renderSvg(c: DiceBearConfig, size = 128): string {
  const opts: Record<string, unknown> = {
    size,
    backgroundColor: [BACKGROUNDS[clamp(c.bg, BACKGROUNDS.length)]],
    backgroundType: ["solid"],
    // SVG BG fills the full rectangle; the host element's CSS rounding
    // (rounded-full or rounded-2xl) decides the visible shape.
    radius: 0,
    hair: [variants.hair[clamp(c.hair, variants.hair.length)]],
    eyes: [variants.eyes[clamp(c.eyes, variants.eyes.length)]],
    mouth: [variants.mouth[clamp(c.mouth, variants.mouth.length)]],
    eyebrows: [variants.eyebrows[clamp(c.eyebrows, variants.eyebrows.length)]],
    skinColor: [SKIN_COLORS[clamp(c.skin, SKIN_COLORS.length)]],
    hairColor: [HAIR_COLORS[clamp(c.hairColor, HAIR_COLORS.length)]],
  };
  if (c.glasses >= 0 && variants.glasses.length) {
    opts.glasses = [variants.glasses[clamp(c.glasses, variants.glasses.length)]];
    opts.glassesProbability = 100;
  } else {
    opts.glassesProbability = 0;
  }
  if (c.earrings >= 0 && variants.earrings.length) {
    opts.earrings = [variants.earrings[clamp(c.earrings, variants.earrings.length)]];
    opts.earringsProbability = 100;
  } else {
    opts.earringsProbability = 0;
  }
  if (c.features >= 0 && variants.features.length) {
    opts.features = [variants.features[clamp(c.features, variants.features.length)]];
    opts.featuresProbability = 100;
  } else {
    opts.featuresProbability = 0;
  }
  return createAvatar(adventurer, opts).toString();
}
