import { describe, expect, it, vi } from "vitest";

import {
  deleteFamilyRating,
  deleteOutfit,
  listFamilyRatings,
  submitFamilyRating,
  submitOutfitFeedback,
} from "./outfits";
import type { WardrowbeApi } from "./types";

describe("outfits family & feedback", () => {
  it("submitFamilyRating posts rating", async () => {
    const post = vi.fn().mockResolvedValue({});
    const api = { get: vi.fn(), post, patch: vi.fn(), delete: vi.fn() } as unknown as WardrowbeApi;
    await submitFamilyRating(api, "o1", { rating: 5, comment: "great" });
    expect(post).toHaveBeenCalledWith("/outfits/o1/family-rating", { rating: 5, comment: "great" });
  });

  it("listFamilyRatings gets list", async () => {
    const get = vi.fn().mockResolvedValue([]);
    const api = { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as WardrowbeApi;
    await listFamilyRatings(api, "o1");
    expect(get).toHaveBeenCalledWith("/outfits/o1/family-ratings");
  });

  it("deleteFamilyRating deletes rating", async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    const api = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: del } as unknown as WardrowbeApi;
    await deleteFamilyRating(api, "o1");
    expect(del).toHaveBeenCalledWith("/outfits/o1/family-rating");
  });

  it("deleteOutfit deletes outfit", async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    const api = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: del } as unknown as WardrowbeApi;
    await deleteOutfit(api, "o1");
    expect(del).toHaveBeenCalledWith("/outfits/o1");
  });

  it("submitOutfitFeedback posts body", async () => {
    const post = vi.fn().mockResolvedValue({});
    const api = { get: vi.fn(), post, patch: vi.fn(), delete: vi.fn() } as unknown as WardrowbeApi;
    await submitOutfitFeedback(api, "o1", { accepted: true });
    expect(post).toHaveBeenCalledWith("/outfits/o1/feedback", { accepted: true });
  });
});
