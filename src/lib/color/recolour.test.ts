import { describe, it, expect } from "vitest";
import { buildMask, applyMaskedTint } from "./recolour";
import { hexToRgb } from "./convert";

/** Build a flat RGBA buffer from a list of hex colours. */
function buffer(hexes: string[], alpha = 255): Uint8ClampedArray {
  const data = new Uint8ClampedArray(hexes.length * 4);
  hexes.forEach((hex, i) => {
    const { r, g, b } = hexToRgb(hex);
    data[i * 4] = r; data[i * 4 + 1] = g; data[i * 4 + 2] = b; data[i * 4 + 3] = alpha;
  });
  return data;
}

describe("buildMask", () => {
  it("selects the target colour and leaves other colours alone", () => {
    const data = buffer(["#ffdf00", "#009c3b", "#ffdf00", "#002776"]);
    const mask = buildMask(data, "#ffdf00", 20);
    expect(mask.count).toBe(2);
    expect(Array.from(mask.indices)).toEqual([0, 2]);
  });

  it("includes near-misses inside the tolerance", () => {
    const data = buffer(["#ffdf00", "#ffe20a"]);
    expect(buildMask(data, "#ffdf00", 20).count).toBe(2);
  });

  it("excludes colours outside the tolerance", () => {
    const data = buffer(["#ffdf00", "#0033ff"]);
    expect(buildMask(data, "#ffdf00", 10).count).toBe(1);
  });

  it("ignores transparent pixels", () => {
    const data = buffer(["#ffdf00", "#ffdf00"], 0);
    expect(buildMask(data, "#ffdf00", 30).count).toBe(0);
  });

  it("treats hue as circular so reds are selectable", () => {
    // 358° and 4° are 6° apart. A naive linear hue distance would call them
    // 354° apart and refuse to select the second one.
    const data = buffer(["#ff0511", "#ff1105"]);
    const mask = buildMask(data, "#ff0511", 12);
    expect(mask.count).toBe(2);
  });
});

describe("applyMaskedTint", () => {
  it("shifts only the masked pixels", () => {
    const source = buffer(["#ffdf00", "#009c3b"]);
    const dest = new Uint8ClampedArray(source.length);
    const mask = buildMask(source, "#ffdf00", 20);

    applyMaskedTint(source, dest, mask, 120, 1, 0);

    // Pixel 0 was in the mask and must have moved.
    expect([dest[0], dest[1], dest[2]]).not.toEqual([source[0], source[1], source[2]]);
    // Pixel 1 was not, and must be untouched.
    expect([dest[4], dest[5], dest[6]]).toEqual([source[4], source[5], source[6]]);
  });

  it("is a no-op at neutral settings", () => {
    const source = buffer(["#ffdf00", "#009c3b", "#002776"]);
    const dest = new Uint8ClampedArray(source.length);
    const mask = buildMask(source, "#ffdf00", 20);

    applyMaskedTint(source, dest, mask, 0, 1, 0);
    for (let i = 0; i < source.length; i++) {
      expect(dest[i]).toBeCloseTo(source[i], 0);
    }
  });

  it("never compounds — reading from source each time keeps it reversible", () => {
    // The reason source and dest are separate buffers. Recolouring in place
    // would apply the shift on top of the previous shift on every slider tick
    // and drift away from the original.
    const source = buffer(["#ffdf00"]);
    const dest = new Uint8ClampedArray(source.length);
    const mask = buildMask(source, "#ffdf00", 20);

    applyMaskedTint(source, dest, mask, 90, 1, 0);
    applyMaskedTint(source, dest, mask, 90, 1, 0);
    const once = Array.from(dest);

    applyMaskedTint(source, dest, mask, 90, 1, 0);
    expect(Array.from(dest)).toEqual(once);
  });

  it("preserves alpha", () => {
    const source = buffer(["#ffdf00"], 128);
    const dest = new Uint8ClampedArray(source.length);
    const mask = buildMask(source, "#ffdf00", 30);
    applyMaskedTint(source, dest, mask, 60, 1.4, 5);
    expect(dest[3]).toBe(128);
  });
});
