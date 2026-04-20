import { createAvatar } from "@dicebear/core";
import { notionists } from "@dicebear/collection";

// Avatar config stored as compact string: "d1:H:E:L:N:B:Bd:Bd:G:BG"
// where each letter is a zero-based index into the style's variant list.
// -1 for optional features (beard, glasses) means "not shown".

type Category = "hair" | "eyes" | "lips" | "nose" | "brows" | "body" | "beard" | "glasses";

const CATEGORIES: Category[] = ["hair", "eyes", "lips", "nose", "brows", "body", "beard", "glasses"];

// Extract variant lists from the Notionists schema once. These are style-defined;
// if DiceBear ships new variants in a minor version, old stored configs still resolve
// because indices are bounded by getVariants(...).length.
const schemaProps = (notionists.schema?.properties ?? {}) as Record<
  string,
  { items?: { enum?: string[] } }
>;
const variants: Record<Category, string[]> = {
  hair: schemaProps.hair?.items?.enum ?? [],
  eyes: schemaProps.eyes?.items?.enum ?? [],
  lips: schemaProps.lips?.items?.enum ?? [],
  nose: schemaProps.nose?.items?.enum ?? [],
  brows: schemaProps.brows?.items?.enum ?? [],
  body: schemaProps.body?.items?.enum ?? [],
  beard: schemaProps.beard?.items?.enum ?? [],
  glasses: schemaProps.glasses?.items?.enum ?? [],
};

// Palette of pleasant backgrounds that work on #0e0e0e panels.
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
  lips: number;
  nose: number;
  brows: number;
  body: number;
  beard: number;   // -1 = no beard
  glasses: number; // -1 = no glasses
  bg: number;      // index into BACKGROUNDS
}

/** Get variant count for a category (useful for option grids). */
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
    "d1",
    c.hair,
    c.eyes,
    c.lips,
    c.nose,
    c.brows,
    c.body,
    c.beard,
    c.glasses,
    c.bg,
  ].join(":");
}

export function decode(s: string): DiceBearConfig | null {
  if (!s.startsWith("d1:")) return null;
  const parts = s.split(":");
  if (parts.length !== 10) return null;
  const nums = parts.slice(1).map((p) => parseInt(p, 10));
  if (nums.some((n) => isNaN(n))) return null;
  return {
    hair: nums[0],
    eyes: nums[1],
    lips: nums[2],
    nose: nums[3],
    brows: nums[4],
    body: nums[5],
    beard: nums[6],
    glasses: nums[7],
    bg: nums[8],
  };
}

export const DEFAULT_CONFIG: DiceBearConfig = {
  hair: 0,
  eyes: 0,
  lips: 0,
  nose: 0,
  brows: 0,
  body: 0,
  beard: -1,
  glasses: -1,
  bg: 0,
};

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/** Randomize all features. Beard/glasses appear with modest probability so
 *  not every avatar is over-decorated. */
export function randomConfig(): DiceBearConfig {
  return {
    hair: randInt(variants.hair.length),
    eyes: randInt(variants.eyes.length),
    lips: randInt(variants.lips.length),
    nose: randInt(variants.nose.length),
    brows: randInt(variants.brows.length),
    body: randInt(variants.body.length),
    beard: Math.random() < 0.25 ? randInt(variants.beard.length) : -1,
    glasses: Math.random() < 0.3 ? randInt(variants.glasses.length) : -1,
    bg: randInt(BACKGROUNDS.length),
  };
}

/** Re-roll a single feature. */
export function rerollCategory(c: DiceBearConfig, cat: Category | "bg"): DiceBearConfig {
  if (cat === "bg") return { ...c, bg: randInt(BACKGROUNDS.length) };
  if (cat === "beard" || cat === "glasses") {
    // Cycle: -1 → random variant → different random variant → -1 → ...
    if (c[cat] === -1) return { ...c, [cat]: randInt(variants[cat].length) };
    const nextIdx = randInt(variants[cat].length);
    // 25% chance of toggling off
    if (Math.random() < 0.25) return { ...c, [cat]: -1 };
    return { ...c, [cat]: nextIdx === c[cat] ? (nextIdx + 1) % variants[cat].length : nextIdx };
  }
  const count = variants[cat].length;
  const next = randInt(count);
  return { ...c, [cat]: next === c[cat] ? (next + 1) % count : next };
}

/** Explicitly set one feature to a specific variant index. */
export function setFeature(c: DiceBearConfig, cat: Category | "bg", idx: number): DiceBearConfig {
  if (cat === "bg") return { ...c, bg: clamp(idx, BACKGROUNDS.length) };
  return { ...c, [cat]: clamp(idx, variants[cat].length) };
}

/** Render the config as an SVG string. */
export function renderSvg(c: DiceBearConfig, size = 128): string {
  const opts: Record<string, unknown> = {
    size,
    backgroundColor: [BACKGROUNDS[clamp(c.bg, BACKGROUNDS.length)]],
    backgroundType: ["solid"],
    radius: 50,
    hair: [variants.hair[clamp(c.hair, variants.hair.length)]],
    eyes: [variants.eyes[clamp(c.eyes, variants.eyes.length)]],
    lips: [variants.lips[clamp(c.lips, variants.lips.length)]],
    nose: [variants.nose[clamp(c.nose, variants.nose.length)]],
    brows: [variants.brows[clamp(c.brows, variants.brows.length)]],
    body: [variants.body[clamp(c.body, variants.body.length)]],
  };
  if (c.beard >= 0 && variants.beard.length) {
    opts.beard = [variants.beard[clamp(c.beard, variants.beard.length)]];
    opts.beardProbability = 100;
  } else {
    opts.beardProbability = 0;
  }
  if (c.glasses >= 0 && variants.glasses.length) {
    opts.glasses = [variants.glasses[clamp(c.glasses, variants.glasses.length)]];
    opts.glassesProbability = 100;
  } else {
    opts.glassesProbability = 0;
  }
  return createAvatar(notionists, opts).toString();
}
