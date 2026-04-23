import { describe, expect, it, vi } from "vitest";

import { deletePairing, generatePairings, listItemPairings, listPairings } from "./pairings";
import type { WardrowbeApi } from "./types";

function mockApi() {
  const get = vi.fn();
  const post = vi.fn();
  const del = vi.fn();
  return { get, post, delete: del, api: { get, post, patch: vi.fn(), delete: del } as WardrowbeApi };
}

describe("pairings service", () => {
  it("listPairings includes source_type when set", async () => {
    const { get, api } = mockApi();
    get.mockResolvedValue({ pairings: [], total: 0, page: 1, page_size: 20, has_more: false });
    await listPairings(api, 1, 20, "pairing");
    expect(get).toHaveBeenCalledWith("/pairings", {
      params: { page: "1", page_size: "20", source_type: "pairing" },
    });
  });

  it("listItemPairings uses item path", async () => {
    const { get, api } = mockApi();
    get.mockResolvedValue({ pairings: [], total: 0, page: 1, page_size: 10, has_more: false });
    await listItemPairings(api, "item-1", 2, 10);
    expect(get).toHaveBeenCalledWith("/pairings/item/item-1", { params: { page: "2", page_size: "10" } });
  });

  it("generatePairings posts num_pairings", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({ generated: 2, pairings: [] });
    await generatePairings(api, "item-1", { num_pairings: 5 });
    expect(post).toHaveBeenCalledWith("/pairings/generate/item-1", { num_pairings: 5 });
  });

  it("deletePairing deletes by id", async () => {
    const { delete: del, api } = mockApi();
    del.mockResolvedValue({});
    await deletePairing(api, "p1");
    expect(del).toHaveBeenCalledWith("/pairings/p1");
  });
});
