import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeName, sanitizeEmoji } from "./sanitize";

/**
 * `sanitize.ts` sits on the path of everything a player types, and one of its
 * rules was already wrong once in a way that cost people points: it stripped
 * `&`, so "Fish & Chips" reached `fuzzyMatch` as "Fish  Chips" and scored zero.
 * These tests pin the behaviour that fix depends on.
 */
describe("sanitizeText", () => {
  it("strips the characters that could open a tag or attribute", () => {
    expect(sanitizeText('<script>alert("x")</script>')).toBe("scriptalert(x)/script");
  });

  it("keeps `&` — the regression that scored real answers as wrong", () => {
    expect(sanitizeText("Fish & Chips")).toBe("Fish & Chips");
    expect(sanitizeText("AT&T")).toBe("AT&T");
  });

  it("trims and truncates to the limit", () => {
    expect(sanitizeText("   padded   ")).toBe("padded");
    expect(sanitizeText("x".repeat(80))).toHaveLength(50);
    expect(sanitizeText("x".repeat(80), 10)).toHaveLength(10);
  });

  it("keeps accents and non-Latin scripts intact", () => {
    // Player answers and quiz content are not ASCII-only.
    expect(sanitizeText("Bačiauskas")).toBe("Bačiauskas");
    expect(sanitizeText("日本")).toBe("日本");
  });

  it("returns an empty string for input that was only junk", () => {
    expect(sanitizeText("<<>>")).toBe("");
  });
});

describe("sanitizeName", () => {
  it("removes whole tags rather than leaving their contents", () => {
    expect(sanitizeName("<b>Auri</b>")).toBe("Auri");
  });

  it("strips the characters that could break out of markup or a call", () => {
    expect(sanitizeName("Auri&<>\"'`;(){}")).toBe("Auri");
  });

  it("caps at 30 characters", () => {
    expect(sanitizeName("A".repeat(50))).toHaveLength(30);
  });

  it("keeps letters from any script, digits, spaces and dashes", () => {
    expect(sanitizeName("Aiza-Marie 2")).toBe("Aiza-Marie 2");
    expect(sanitizeName("Бот")).toBe("Бот");
  });
});

describe("sanitizeEmoji", () => {
  it("passes a DiceBear avatar config through unchanged", () => {
    // The reason the limit is 120 rather than a couple of characters.
    const config = "d1:04:02:03:01:05:06:06:00:07";
    expect(sanitizeEmoji(config)).toBe(config);
  });

  it("passes a plain emoji through", () => {
    expect(sanitizeEmoji("🤖")).toBe("🤖");
  });

  it("caps length before stripping, so a long tag can't survive by being cut", () => {
    expect(sanitizeEmoji("x".repeat(200)).length).toBeLessThanOrEqual(120);
  });

  it("strips tags", () => {
    expect(sanitizeEmoji("<img src=x>🤖")).toBe("🤖");
  });
});
