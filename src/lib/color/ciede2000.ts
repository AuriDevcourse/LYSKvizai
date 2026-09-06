import type { Lab } from "./convert";

/**
 * CIEDE2000 colour difference (ΔE₀₀).
 *
 * The perceptual standard — it corrects CIELAB's known non-uniformities with
 * weighting functions for lightness, chroma and hue, plus a rotation term that
 * handles the blue region where CIELAB is worst.
 *
 * Implemented from Sharma, Wu & Dalal (2005), "The CIEDE2000 color-difference
 * formula: implementation notes, supplementary test data, and mathematical
 * observations", Color Research & Application 30(1), 21-30.
 *
 * The two places implementations usually go wrong, both handled below:
 *   1. Hue angles live in different quadrants, so h' must come from atan2 and be
 *      normalised to [0, 360), and the mean hue needs the ±180° correction.
 *   2. When either chroma is zero the hue is undefined; Δh' must be 0 and the
 *      mean hue must be the sum rather than the average.
 *
 * Validated in ciede2000.test.ts against the published Sharma reference pairs
 * — including the ones written specifically to catch those two mistakes.
 *
 * Rough reading of the result: <1 is imperceptible to most people, 1-2 is
 * noticeable on close inspection, >5 reads as a different colour.
 */
const deg = (rad: number) => (rad * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

export function ciede2000(c1: Lab, c2: Lab, kL = 1, kC = 1, kH = 1): number {
  const { L: L1, a: a1, b: b1 } = c1;
  const { L: L2, a: a2, b: b2 } = c2;

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;

  // G expands the a* axis for low-chroma colours, which is what fixes CIELAB's
  // grey-region distortion. The 25^7 constant is from the spec.
  const Cbar7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));

  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);

  // Hue angles in degrees, [0, 360). Undefined (and defined as 0) at zero chroma.
  const hue = (b: number, ap: number) => {
    if (b === 0 && ap === 0) return 0;
    const h = deg(Math.atan2(b, ap));
    return h >= 0 ? h : h + 360;
  };
  const h1p = hue(b1, a1p);
  const h2p = hue(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  // Δh′ — zero when either chroma is zero, otherwise wrapped into (-180, 180].
  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp) / 2);

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;

  // Mean hue. With zero chroma the average is meaningless, so use the sum (the
  // undefined angle contributes 0). Otherwise correct across the 0/360 seam.
  let hbarp: number;
  if (C1p * C2p === 0) {
    hbarp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hbarp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hbarp = (h1p + h2p + 360) / 2;
  } else {
    hbarp = (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos(rad(hbarp - 30)) +
    0.24 * Math.cos(rad(2 * hbarp)) +
    0.32 * Math.cos(rad(3 * hbarp + 6)) -
    0.20 * Math.cos(rad(4 * hbarp - 63));

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Cbarp7 = Math.pow(Cbarp, 7);
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)));
  // The rotation term: only meaningfully non-zero in the blue/violet region.
  const RT = -Math.sin(rad(2 * dTheta)) * RC;

  const SL = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;

  const l = dLp / (kL * SL);
  const c = dCp / (kC * SC);
  const h = dHp / (kH * SH);

  return Math.sqrt(l * l + c * c + h * h + RT * c * h);
}
