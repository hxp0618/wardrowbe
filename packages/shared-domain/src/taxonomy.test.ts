import { describe, expect, it } from "vitest";

import { CLOTHING_COLORS, CLOTHING_TYPES, OCCASIONS } from "./types";

describe("taxonomy constants", () => {
  it("CLOTHING_COLORS has unique values and hex-like strings", () => {
    const values = CLOTHING_COLORS.map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
    for (const c of CLOTHING_COLORS) {
      expect(c.hex).toMatch(/^#/);
      expect(c.hex.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("CLOTHING_TYPES has unique values", () => {
    const values = CLOTHING_TYPES.map((t) => t.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("OCCASIONS has unique values", () => {
    const values = OCCASIONS.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
