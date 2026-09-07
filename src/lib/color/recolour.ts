import { rgbToHsl, hslToRgb, hexToRgb } from "./convert";

/**
 * Selective recolouring of an image region.
 *
 * The game needs to change "the yellow part" of a picture and nothing else.
 * That means a per-pixel decision — is this pixel part of the region? — and
 * then the same hue/saturation/lightness transform the sliders apply elsewhere.
 *
 * The mask uses HSL distance rather than CIEDE2000. ΔE₀₀ is the right metric
 * for *scoring* a colour, but running it on every pixel of a 600×600 image is
 * ~360k invocations of a heavy trigonometric function per slider tick. HSL
 * distance is a good enough answer to "is this the same paint?" and fast enough
 * to run on every frame.
 *
 * Hue is weighted most heavily because it's what identifies a region ("the
 * yellow bit"), and hue distance is circular — 350° and 10° are 20° apart, not
 * 340°. Getting that wrong makes reds unselectable.
 */

export interface RegionMask {
  /** Indices into the pixel array (one per pixel, not per byte). */
  indices: Uint32Array;
  /** How many pixels matched. */
  count: number;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Find every pixel within `tolerance` of `targetHex`.
 *
 * Computed once per round rather than per slider tick — the mask depends on the
 * image and the target colour, neither of which changes while the player drags.
 */
export function buildMask(
  data: Uint8ClampedArray,
  targetHex: string,
  tolerance: number
): RegionMask {
  const target = rgbToHsl(hexToRgb(targetHex));
  const out = new Uint32Array(data.length / 4);
  let count = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // Skip transparent pixels — they carry no colour worth matching.
    if (data[i + 3] < 16) continue;

    const hsl = rgbToHsl({ r: data[i], g: data[i + 1], b: data[i + 2] });

    // Near-grey pixels have an unstable hue, so judge them on saturation and
    // lightness alone. Without this, dark outlines flicker in and out of the
    // mask as the hue term swings wildly on tiny colour changes.
    const bothChromatic = hsl.s > 8 && target.s > 8;
    const hueTerm = bothChromatic ? hueDistance(hsl.h, target.h) * 0.55 : 0;
    const satTerm = Math.abs(hsl.s - target.s) * 0.9;
    const lightTerm = Math.abs(hsl.l - target.l) * 0.9;

    const distance = Math.sqrt(hueTerm * hueTerm + satTerm * satTerm + lightTerm * lightTerm);
    if (distance <= tolerance) {
      out[count++] = p;
    }
  }

  return { indices: out.subarray(0, count), count };
}

/**
 * Write a recoloured copy of `source` into `dest`, shifting only masked pixels.
 *
 * `dest` must be the same length as `source`. The caller owns both buffers so
 * the original pixels survive across slider moves — recolouring in place would
 * compound the transform on every tick and drift away from the truth.
 */
export function applyMaskedTint(
  source: Uint8ClampedArray,
  dest: Uint8ClampedArray,
  mask: RegionMask,
  hueShift: number,
  satScale: number,
  lightShift: number
): void {
  dest.set(source);

  for (let k = 0; k < mask.count; k++) {
    const i = mask.indices[k] * 4;
    const hsl = rgbToHsl({ r: source[i], g: source[i + 1], b: source[i + 2] });
    const rgb = hslToRgb({
      h: (((hsl.h + hueShift) % 360) + 360) % 360,
      s: Math.min(100, Math.max(0, hsl.s * satScale)),
      l: Math.min(100, Math.max(0, hsl.l + lightShift)),
    });
    dest[i] = rgb.r;
    dest[i + 1] = rgb.g;
    dest[i + 2] = rgb.b;
  }
}
