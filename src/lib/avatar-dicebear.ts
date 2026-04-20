import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";

// Avatar config stored as compact string: "d2:H:E:M:B:G:Er:F:BG"
// where each letter is a zero-based index into the style's variant list.
// -1 for optional features (glasses, earrings, features) means "not shown".
//
// Prefix d2 = adventurer style. (d1 = legacy notionists, no longer generated.)

type Category = "hair" | "eyes" | "mouth" | "eyebrows" | "glasses" | "earrings" | "features";

const CATEGORIES: Category[] = ["hair", "eyes", "mouth", "eyebrows", "glasses", "earrings", "features"];

const schemaProps = (adventurer.schema?.properties ?? {}) as Record<
  string,
  { items?: { enum?: string[] } }
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
}

export function variantCount(cat: Category): number {
  return variants[cat].length;
}

export function backgroundCount(): number {
  return BACKGROUNDS.length;
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
  ].join(":");
}

export function decode(s: string): DiceBearConfig | null {
  if (!s.startsWith("d2:")) return null;
  const parts = s.split(":");
  if (parts.length !== 9) return null;
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
};

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/** Randomize all features. Optional extras appear at modest rates so avatars
 *  don't feel over-decorated by default. */
export function randomConfig(): DiceBearConfig {
  return {
    hair: randInt(variants.hair.length),
    eyes: randInt(variants.eyes.length),
    mouth: randInt(variants.mouth.length),
    eyebrows: randInt(variants.eyebrows.length),
    glasses: Math.random() < 0.25 ? randInt(variants.glasses.length) : -1,
    earrings: Math.random() < 0.2 ? randInt(variants.earrings.length) : -1,
    features: Math.random() < 0.3 ? randInt(variants.features.length) : -1,
    bg: randInt(BACKGROUNDS.length),
  };
}

export function rerollCategory(c: DiceBearConfig, cat: Category | "bg"): DiceBearConfig {
  if (cat === "bg") return { ...c, bg: randInt(BACKGROUNDS.length) };
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

export function setFeature(c: DiceBearConfig, cat: Category | "bg", idx: number): DiceBearConfig {
  if (cat === "bg") return { ...c, bg: clamp(idx, BACKGROUNDS.length) };
  return { ...c, [cat]: clamp(idx, variants[cat].length) };
}

export function renderSvg(c: DiceBearConfig, size = 128): string {
  const opts: Record<string, unknown> = {
    size,
    backgroundColor: [BACKGROUNDS[clamp(c.bg, BACKGROUNDS.length)]],
    backgroundType: ["solid"],
    radius: 50,
    hair: [variants.hair[clamp(c.hair, variants.hair.length)]],
    eyes: [variants.eyes[clamp(c.eyes, variants.eyes.length)]],
    mouth: [variants.mouth[clamp(c.mouth, variants.mouth.length)]],
    eyebrows: [variants.eyebrows[clamp(c.eyebrows, variants.eyebrows.length)]],
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
