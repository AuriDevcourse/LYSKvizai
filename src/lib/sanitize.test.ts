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

  /*
   * The contract changed deliberately: markup no longer gets laundered out of a
   * value that is then kept. Anything unrecognised is rejected whole and the
   * caller falls back to the default avatar.
   *
   * Laundering was the weaker guarantee. This value arrives from whoever is
   * joining and ends up in `dangerouslySetInnerHTML` and an `<img src>`, so
   * "strip the bits I know about and keep the rest" only holds while every
   * consumer stays careful. An allowlist holds regardless.
   */
  it("rejects anything containing markup rather than laundering it", () => {
    expect(sanitizeEmoji("<img src=x>🤖")).toBe("");
    expect(sanitizeEmoji("<script>alert(1)</script>")).toBe("");
    expect(sanitizeEmoji('" onerror="alert(1)')).toBe("");
  });

  it("keeps the shapes the app actually produces", () => {
    // The avatar builder's DiceBear config, including the -1 "not shown" slots.
    expect(sanitizeEmoji("d2:1:2:3:4:-1:-1:-1:5:0:0")).toBe("d2:1:2:3:4:-1:-1:-1:5:0:0");
    // A bare portrait file, and the prefixed form with a background colour.
    expect(sanitizeEmoji("punk-asian-female.svg")).toBe("punk-asian-female.svg");
    expect(sanitizeEmoji("svg:punk-asian-female.svg:#e8590c")).toBe("svg:punk-asian-female.svg:#e8590c");
    // A plain emoji.
    expect(sanitizeEmoji("🤖")).toBe("🤖");
  });

  it("refuses anything that could be read as a path", () => {
    expect(sanitizeEmoji("svg:../../etc/passwd")).toBe("");
    expect(sanitizeEmoji("../../../secret.svg")).toBe("");
    expect(sanitizeEmoji("svg:/absolute.svg")).toBe("");
  });
});
