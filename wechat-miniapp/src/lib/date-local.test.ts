import { describe, expect, it, vi } from "vitest";

import { addDays, getForecastDaysForTargetDate, isFutureISODate, toLocalISODate } from "./date-local";

describe("date-local", () => {
  it("toLocalISODate", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00"));
    expect(toLocalISODate(new Date())).toBe("2026-06-10");
    vi.useRealTimers();
  });

  it("isFutureISODate", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00"));
    expect(isFutureISODate("2026-06-11")).toBe(true);
    expect(isFutureISODate("2026-06-10")).toBe(false);
    vi.useRealTimers();
  });

  it("getForecastDaysForTargetDate", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00"));
    expect(getForecastDaysForTargetDate("2026-06-10")).toBe(0);
    expect(getForecastDaysForTargetDate("2026-06-11")).toBe(2);
    vi.useRealTimers();
  });

  it("addDays", () => {
    const d = new Date("2026-01-01T12:00:00");
    expect(toLocalISODate(addDays(d, 1))).toBe("2026-01-02");
  });
});
