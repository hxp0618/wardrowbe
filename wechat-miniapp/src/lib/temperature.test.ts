import { describe, expect, it } from "vitest";

import { displayValue, tempSymbol, toCelsius, toF } from "./temperature";

describe("temperature", () => {
  it("converts celsius to fahrenheit", () => {
    expect(toF(0)).toBe(32);
    expect(toF(100)).toBe(212);
  });

  it("toCelsius rounds", () => {
    expect(toCelsius(32)).toBe(0);
    expect(toCelsius(50)).toBe(10);
  });

  it("displayValue respects unit", () => {
    expect(displayValue(20, "celsius")).toBe(20);
    expect(displayValue(0, "fahrenheit")).toBe(32);
  });

  it("tempSymbol", () => {
    expect(tempSymbol("celsius")).toBe("°C");
    expect(tempSymbol("fahrenheit")).toBe("°F");
  });
});
