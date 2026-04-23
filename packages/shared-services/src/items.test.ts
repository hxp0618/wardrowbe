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

  it("includes folder_id and sort params", () => {
    const p = buildItemsQueryParams(
      { folder_id: "f1", sort_by: "last_worn", sort_order: "asc", needs_wash: true, is_archived: false },
      1,
      20,
    );
    expect(p.folder_id).toBe("f1");
    expect(p.sort_by).toBe("last_worn");
    expect(p.sort_order).toBe("asc");
    expect(p.needs_wash).toBe("true");
    expect(p.is_archived).toBe("false");
  });
});
