import { describe, it, expect } from "vitest";
import { ciede2000 } from "./ciede2000";
import { rgbToLab, hexToRgb, rgbToHsl, hslToRgb, adjustHex } from "./convert";

/**
 * Reference pairs from Sharma, Wu & Dalal (2005), Table 1 — the dataset written
 * specifically to break naive implementations. Pairs 1-4 straddle the 0/360 hue
 * seam, 8-11 sit in the blue region where the RT rotation term bites, and
 * 15-17 have a zero chroma on one side where hue is undefined.
 */
const SHARMA: [number[], number[], number][] = [
  [[50.0000, 2.6772, -79.7751], [50.0000, 0.0000, -82.7485], 2.0425],
  [[50.0000, 3.1571, -77.2803], [50.0000, 0.0000, -82.7485], 2.8615],
  [[50.0000, 2.8361, -74.0200], [50.0000, 0.0000, -82.7485], 3.4412],
  [[50.0000, -1.3802, -84.2814], [50.0000, 0.0000, -82.7485], 1.0000],
  [[50.0000, -1.1848, -84.8006], [50.0000, 0.0000, -82.7485], 1.0000],
  [[50.0000, -0.9009, -85.5211], [50.0000, 0.0000, -82.7485], 1.0000],
  [[50.0000, 0.0000, 0.0000], [50.0000, -1.0000, 2.0000], 2.3669],
  [[50.0000, -1.0000, 2.0000], [50.0000, 0.0000, 0.0000], 2.3669],
  [[50.0000, 2.4900, -0.0010], [50.0000, -2.4900, 0.0009], 7.1792],
  [[50.0000, 2.4900, -0.0010], [50.0000, -2.4900, 0.0010], 7.1792],
  [[50.0000, 2.4900, -0.0010], [50.0000, -2.4900, 0.0011], 7.2195],
  [[50.0000, 2.4900, -0.0010], [50.0000, -2.4900, 0.0012], 7.2195],
  [[50.0000, -0.0010, 2.4900], [50.0000, 0.0009, -2.4900], 4.8045],
  [[50.0000, -0.0010, 2.4900], [50.0000, 0.0011, -2.4900], 4.7461],
  [[50.0000, 2.5000, 0.0000], [50.0000, 0.0000, -2.5000], 4.3065],
  [[50.0000, 2.5000, 0.0000], [73.0000, 25.0000, -18.0000], 27.1492],
  [[50.0000, 2.5000, 0.0000], [61.0000, -5.0000, 29.0000], 22.8977],
  [[50.0000, 2.5000, 0.0000], [56.0000, -27.0000, -3.0000], 31.9030],
  [[50.0000, 2.5000, 0.0000], [58.0000, 24.0000, 15.0000], 19.4535],
  [[50.0000, 2.5000, 0.0000], [50.0000, 3.1736, 0.5854], 1.0000],
  [[50.0000, 2.5000, 0.0000], [50.0000, 3.2972, 0.0000], 1.0000],
  [[50.0000, 2.5000, 0.0000], [50.0000, 1.8634, 0.5757], 1.0000],
  [[50.0000, 2.5000, 0.0000], [50.0000, 3.2592, 0.3350], 1.0000],
  [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
  [[63.0109, -31.0961, -5.8663], [62.8187, -29.7946, -4.0864], 1.2630],
  [[61.2901, 3.7196, -5.3901], [61.4292, 2.2480, -4.9620], 1.8731],
  [[35.0831, -44.1164, 3.7933], [35.0232, -40.0716, 1.5901], 1.8645],
  [[22.7233, 20.0904, -46.6940], [23.0331, 14.9730, -42.5619], 2.0373],
  [[36.4612, 47.8580, 18.3852], [36.2715, 50.5065, 21.2231], 1.4146],
  [[90.8027, -2.0831, 1.4410], [91.1528, -1.6435, 0.0447], 1.4441],
  [[90.9257, -0.5406, -0.9208], [88.6381, -0.8985, -0.7239], 1.5381],
  [[6.7747, -0.2908, -2.4247], [5.8714, -0.0985, -2.2286], 0.6377],
  [[2.0776, 0.0795, -1.1350], [0.9033, -0.0636, -0.5514], 0.9082],
];

describe("ciede2000", () => {
  it("matches every Sharma reference pair to 4 decimal places", () => {
    for (const [[L1, a1, b1], [L2, a2, b2], expected] of SHARMA) {
      const got = ciede2000({ L: L1, a: a1, b: b1 }, { L: L2, a: a2, b: b2 });
      expect(got).toBeCloseTo(expected, 4);
    }
  });

  it("is zero for identical colours", () => {
    expect(ciede2000({ L: 42, a: 13, b: -7 }, { L: 42, a: 13, b: -7 })).toBe(0);
  });

  it("is symmetric", () => {
    const x = { L: 22.7233, a: 20.0904, b: -46.694 };
    const y = { L: 23.0331, a: 14.973, b: -42.5619 };
    expect(ciede2000(x, y)).toBeCloseTo(ciede2000(y, x), 10);
  });

  it("matches an independent reference value from python-colormath", () => {
    // Documented in gtaylor/python-colormath's test suite.
    const got = ciede2000(
      { L: 32.8911, a: -53.0107, b: -43.3182 },
      { L: 77.1797, a: 25.5928, b: 17.9412 }
    );
    expect(got).toBeCloseTo(78.772, 3);
  });
});

describe("colour conversion", () => {
  it("puts sRGB primaries where CIELAB says they belong", () => {
    // Known reference values for sRGB white, red and blue under D65.
    const white = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(white.L).toBeCloseTo(100, 2);
    expect(white.a).toBeCloseTo(0, 2);
    expect(white.b).toBeCloseTo(0, 2);

    const red = rgbToLab({ r: 255, g: 0, b: 0 });
    expect(red.L).toBeCloseTo(53.24, 1);
    expect(red.a).toBeCloseTo(80.09, 1);
    expect(red.b).toBeCloseTo(67.20, 1);
  });

  it("round-trips hex through HSL", () => {
    for (const hex of ["#ff9062", "#43a5fc", "#0e0e0e", "#ffffff", "#66bb6a"]) {
      const rgb = hexToRgb(hex);
      const back = hslToRgb(rgbToHsl(rgb));
      expect(back.r).toBeCloseTo(rgb.r, 6);
      expect(back.g).toBeCloseTo(rgb.g, 6);
      expect(back.b).toBeCloseTo(rgb.b, 6);
    }
  });

  it("adjustHex is the identity at neutral settings", () => {
    expect(adjustHex("#ff9062", 0, 1, 0)).toBe("#ff9062");
  });

  it("adjustHex inverts itself for hue rotation", () => {
    // This is what makes the game fair: the scramble and the player's sliders
    // are the same transform, so an exact undo is always reachable.
    const scrambled = adjustHex("#43a5fc", 120, 1, 0);
    expect(adjustHex(scrambled, -120, 1, 0)).toBe("#43a5fc");
  });
});
