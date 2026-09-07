/**
 * Local-only image support for the colour game.
 *
 * The flag rounds ship with the app. This is the other half: point the game at
 * your own reference images — a cartoon character, a logo, a photo — and it
 * isolates one colour region and asks you to restore it, exactly as it does
 * with a flag.
 *
 * Why it works this way
 * ---------------------
 * `public/tint-local/` is gitignored, so nothing you put there is committed or
 * deployed. That matters because the app *is* published at quizmo.auridev.com
 * and most recognisable characters are somebody's intellectual property —
 * shipping their artwork would be infringement, whereas using an image on your
 * own machine for your own play is a different situation entirely. Keeping the
 * folder out of the repo is what makes the distinction hold in practice rather
 * than in intention.
 *
 * To add rounds, drop images in `public/tint-local/` and write a manifest
 * beside them:
 *
 *   public/tint-local/manifest.json
 *   [
 *     {
 *       "file": "sponge.png",
 *       "name": "The sponge",
 *       "label": "the yellow body",
 *       "hex": "#f5e050",
 *       "tolerance": 22
 *     }
 *   ]
 *
 * `hex` is the colour the game treats as correct — sample it from the image
 * with any colour picker. `tolerance` is how far a pixel can sit from that
 * colour and still count as part of the region (in HSL-ish units, 10-35 is the
 * useful range: too low and you get speckle, too high and it bleeds into
 * neighbouring colours).
 */

export interface LocalImageRound {
  /** Filename inside public/tint-local/. */
  file: string;
  /** Shown above the question, e.g. "The sponge". */
  name: string;
  /** What the player is restoring, e.g. "the yellow body". */
  label: string;
  /** The correct colour, as sRGB hex. */
  hex: string;
  /** Selection tolerance for the region mask. Defaults to 22. */
  tolerance?: number;
}

export const LOCAL_MANIFEST_URL = "/tint-local/manifest.json";

function isValidRound(x: unknown): x is LocalImageRound {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.file === "string" && r.file.length > 0 &&
    // Reject anything trying to climb out of the folder.
    !r.file.includes("..") && !r.file.startsWith("/") &&
    typeof r.name === "string" && r.name.length > 0 &&
    typeof r.label === "string" && r.label.length > 0 &&
    typeof r.hex === "string" && /^#[0-9a-f]{6}$/i.test(r.hex) &&
    (r.tolerance === undefined || (typeof r.tolerance === "number" && r.tolerance > 0 && r.tolerance <= 100))
  );
}

/**
 * Load the local manifest, or return an empty list.
 *
 * A missing file is the normal case — most installs have no local images — so
 * it resolves to `[]` rather than throwing. Malformed entries are dropped
 * individually so one typo doesn't hide the rest.
 */
export async function loadLocalRounds(): Promise<LocalImageRound[]> {
  try {
    const res = await fetch(LOCAL_MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter(isValidRound);
  } catch {
    return [];
  }
}
