import { describe, it, expect } from "vitest";
import { fuzzyMatch } from "./fuzzy-match";

/**
 * Regression guard for the short-string tightening in `isWithinDistance`.
 *
 * Generated from the real quiz data: every accepted answer must still be
 * credited when typed exactly, in any case. The tightening only ever
 * removes matches, so this is the check that it removed none that matter.
 */
describe("fuzzyMatch — every accepted answer in the real data still matches", () => {
  it("mixed-quiz #6", () => {
    const accepted = ["Au", "au", "AU"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("mixed-quiz #10", () => {
    const accepted = ["Pacific", "pacific", "Pacific Ocean", "pacific ocean", "the pacific", "The Pacific"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("mixed-quiz #15", () => {
    const accepted = ["Cheetah", "cheetah", "the cheetah", "gepardas"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #1", () => {
    const accepted = ["Eiffel Tower", "eiffel", "tour eiffel"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #2", () => {
    const accepted = ["Colosseum", "coliseum", "colosseo"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #3", () => {
    const accepted = ["Statue of Liberty", "liberty", "statue of liberty"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #4", () => {
    const accepted = ["Great Wall of China", "great wall", "chinese wall"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #5", () => {
    const accepted = ["Taj Mahal", "taj mahal"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #6", () => {
    const accepted = ["Big Ben", "big ben", "elizabeth tower"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #7", () => {
    const accepted = ["Sydney Opera House", "opera house", "sydney opera"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #8", () => {
    const accepted = ["Machu Picchu", "machu pichu", "macchu picchu"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #9", () => {
    const accepted = ["Christ the Redeemer", "cristo redentor", "christ redeemer"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #10", () => {
    const accepted = ["Stonehenge", "stone henge"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #11", () => {
    const accepted = ["Pyramids of Giza", "pyramids", "giza", "pyramid", "great pyramid"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #12", () => {
    const accepted = ["Leaning Tower of Pisa", "tower of pisa", "pisa"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #13", () => {
    const accepted = ["Mount Fuji", "fuji", "mt fuji", "fujisan"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #14", () => {
    const accepted = ["Golden Gate Bridge", "golden gate", "golden gate bridge"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
  it("zoom-out-pictures #15", () => {
    const accepted = ["Parthenon", "acropolis"];
    for (const a of accepted) {
      expect(fuzzyMatch(a, accepted)).toBe(true);
      expect(fuzzyMatch(a.toUpperCase(), accepted)).toBe(true);
    }
  });
});
