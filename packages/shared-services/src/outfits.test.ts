import { describe, expect, it, vi } from "vitest";

import { buildOutfitsQueryParams, listOutfitsForMonth } from "./outfits";
import type { WardrowbeApi } from "./types";

describe("buildOutfitsQueryParams", () => {
  it("includes pagination and filter flags as strings", () => {
    const p = buildOutfitsQueryParams(
      {
        status: "pending",
        is_lookbook: true,
        family_member_id: "uuid-1",
      },
      2,
      15,
    );
    expect(p.page).toBe("2");
    expect(p.page_size).toBe("15");
    expect(p.status).toBe("pending");
    expect(p.is_lookbook).toBe("true");
    expect(p.family_member_id).toBe("uuid-1");
  });
});

describe("listOutfitsForMonth", () => {
  it("requests correct date range for February in a leap year", async () => {
    const get = vi.fn().mockResolvedValue({ outfits: [], total: 0, page: 1, page_size: 100, has_more: false });
    const api = { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as WardrowbeApi;

    await listOutfitsForMonth(api, 2024, 2, { status: "accepted" });

    expect(get).toHaveBeenCalledWith("/outfits", {
      params: expect.objectContaining({
        page: "1",
        page_size: "100",
        date_from: "2024-02-01",
        date_to: "2024-02-29",
        status: "accepted",
      }),
    });
  });
});
