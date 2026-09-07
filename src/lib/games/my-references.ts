"use client";

/**
 * Your own colour references, stored in this browser only.
 *
 * The point of this file
 * ---------------------
 * The best subjects for the game are the ones you already know the colour of,
 * and cartoon characters are the obvious example — everyone knows what shade
 * that sponge is. The blocker was never the idea, it was distribution: this app
 * is deployed at quizmo.auridev.com, and putting someone else's character art
 * in the repo ships it to the public internet.
 *
 * So references you add live in localStorage as downscaled data URLs. They
 * never touch the filesystem, the repo, or the deploy — there is nothing to
 * accidentally commit. Adding a reference is a private act on your own machine,
 * which is a different thing from publishing one.
 *
 * (`public/tint-local/` still works for anything you'd rather keep as a file.
 * This is the zero-friction path: drop an image in, click the colour, play.)
 */

export interface MyReference {
  id: string;
  /** Heading, e.g. "The sponge". */
  name: string;
  /** What's being restored, e.g. "the yellow body". */
  label: string;
  /** The correct colour, sampled from the image itself. */
  hex: string;
  /** Region selection tolerance. */
  tolerance: number;
  /** Downscaled PNG as a data URL. */
  dataUrl: string;
  addedAt: number;
}

const KEY = "quizmo-my-references";
/** Keep the whole store well inside a typical 5 MB localStorage budget. */
export const MAX_TOTAL_BYTES = 3_500_000;
export const MAX_LONG_EDGE = 640;

function isValid(x: unknown): x is MyReference {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.name === "string" && r.name.length > 0 &&
    typeof r.label === "string" && r.label.length > 0 &&
    typeof r.hex === "string" && /^#[0-9a-f]{6}$/i.test(r.hex) &&
    typeof r.tolerance === "number" && r.tolerance > 0 && r.tolerance <= 100 &&
    typeof r.dataUrl === "string" && r.dataUrl.startsWith("data:image/") &&
    typeof r.addedAt === "number"
  );
}

export function loadMyReferences(): MyReference[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    // Drop malformed entries individually rather than losing the whole store.
    return data.filter(isValid);
  } catch {
    return [];
  }
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export function saveMyReference(ref: MyReference): SaveResult {
  try {
    const all = [...loadMyReferences().filter((r) => r.id !== ref.id), ref];
    const payload = JSON.stringify(all);
    if (payload.length > MAX_TOTAL_BYTES) {
      return {
        ok: false,
        error: "Out of room — delete a reference before adding another.",
      };
    }
    localStorage.setItem(KEY, payload);
    return { ok: true };
  } catch {
    // Private browsing, or the quota was hit despite the check above.
    return { ok: false, error: "This browser wouldn't save it. Private window?" };
  }
}

export function deleteMyReference(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadMyReferences().filter((r) => r.id !== id)));
  } catch {
    /* nothing useful to do */
  }
}

/**
 * Load a file, downscale it, and return a PNG data URL plus its pixels.
 *
 * Downscaling is not cosmetic: a phone photo is several megabytes, localStorage
 * is a few, and the game recolours every masked pixel on every slider move.
 * 640px on the long edge is plenty for judging a colour.
 */
export async function fileToDownscaledImage(
  file: File
): Promise<{ dataUrl: string; width: number; height: number; pixels: Uint8ClampedArray }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file isn't an image this browser can read."));
      el.src = url;
    });

    const scale = Math.min(1, MAX_LONG_EDGE / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Couldn't get a drawing context.");
    ctx.drawImage(img, 0, 0, width, height);

    return {
      dataUrl: canvas.toDataURL("image/png"),
      width,
      height,
      pixels: ctx.getImageData(0, 0, width, height).data,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
