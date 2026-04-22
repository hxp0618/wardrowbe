import { describe, expect, it } from "vitest";

import { buildItemsQueryParams } from "./items";

describe("buildItemsQueryParams", () => {
  it("serializes filters and pagination", () => {
    const p = buildItemsQueryParams({ type: "shirt", favorite: true, colors: ["blue", "navy"] }, 2, 10);
    expect(p.page).toBe("2");
    expect(p.page_size).toBe("10");
    expect(p.type).toBe("shirt");
    expect(p.favorite).toBe("true");
    expect(p.colors).toBe("blue,navy");
  });
});
