import { describe, expect, it, vi } from "vitest";

import { daysSinceDateString, wornAgoLabelZh } from "./worn-ago";

describe("wornAgoLabelZh", () => {
  it("returns 今天穿过 for today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T15:00:00"));
    expect(wornAgoLabelZh("2026-04-22T08:00:00Z")).toBe("今天穿过");
    vi.useRealTimers();
  });

  it("returns yesterday for previous calendar day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T12:00:00"));
    expect(wornAgoLabelZh("2026-04-21")).toBe("昨天穿过");
    vi.useRealTimers();
  });

  it("daysSinceDateString", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T12:00:00"));
    expect(daysSinceDateString("2026-04-20")).toBe(2);
    vi.useRealTimers();
  });
});
