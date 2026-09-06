/**
 * Colour space conversions.
 *
 * sRGB → linear RGB → CIEXYZ (D65) → CIELAB. Lab is the space we score in,
 * because a fixed distance in Lab corresponds roughly to a fixed *perceived*
 * difference, which RGB emphatically does not: #000000→#0000ff and
 * #ff0000→#ff00ff are the same RGB distance and nothing like the same visual
 * difference.
 */

export interface RGB { r: number; g: number; b: number } // 0-255
export interface Lab { L: number; a: number; b: number }
export interface HSL { h: number; s: number; l: number } // h 0-360, s/l 0-100

/** D65 reference white, 2° observer. */
const WHITE = { X: 95.047, Y: 100.0, Z: 108.883 };

/** Undo the sRGB transfer function. The 0.04045 knee is part of the spec. */
function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function rgbToXyz({ r, g, b }: RGB): { X: number; Y: number; Z: number } {
  const R = toLinear(r) * 100;
  const G = toLinear(g) * 100;
  const B = toLinear(b) * 100;
  return {
    X: R * 0.4124564 + G * 0.3575761 + B * 0.1804375,
    Y: R * 0.2126729 + G * 0.7151522 + B * 0.0721750,
    Z: R * 0.0193339 + G * 0.1191920 + B * 0.9503041,
  };
}

/** The CIE f(t) with the linear segment below (6/29)^3. */
function labF(t: number): number {
  const d = 6 / 29;
  return t > d * d * d ? Math.cbrt(t) : t / (3 * d * d) + 4 / 29;
}

export function rgbToLab(rgb: RGB): Lab {
  const { X, Y, Z } = rgbToXyz(rgb);
  const fx = labF(X / WHITE.X);
  const fy = labF(Y / WHITE.Y);
  const fz = labF(Z / WHITE.Z);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };

  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === R) h = 60 * (((G - B) / d) % 6);
  else if (max === G) h = 60 * ((B - R) / d + 2);
  else h = 60 * ((R - G) / d + 4);
  if (h < 0) h += 360;

  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const S = s / 100, L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = L - c / 2;
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

/**
 * Apply a hue rotation, a saturation multiplier and a lightness offset to a hex
 * colour. This is how both the scrambler and the player's sliders transform a
 * character's palette — one shared transform, so "what the game did to it" and
 * "what the player can undo" are exactly the same operation.
 */
export function adjustHex(hex: string, hueShift: number, satScale: number, lightShift: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({
    h: (((hsl.h + hueShift) % 360) + 360) % 360,
    s: Math.min(100, Math.max(0, hsl.s * satScale)),
    l: Math.min(100, Math.max(0, hsl.l + lightShift)),
  }));
}
