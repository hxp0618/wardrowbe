import { describe, expect, it, vi } from "vitest";

import {
  acknowledgeInsight,
  generateLearningInsights,
  getItemPairSuggestions,
  getLearningInsights,
  recomputeLearning,
} from "./learning";
import type { WardrowbeApi } from "./types";

function mockApi() {
  const get = vi.fn();
  const post = vi.fn();
  return { get, post, api: { get, post, patch: vi.fn(), delete: vi.fn() } as WardrowbeApi };
}

describe("learning service", () => {
  it("getLearningInsights hits /learning", async () => {
    const { get, api } = mockApi();
    get.mockResolvedValue({ profile: {}, best_pairs: [], insights: [], preference_suggestions: {} });
    await getLearningInsights(api);
    expect(get).toHaveBeenCalledWith("/learning");
  });

  it("recomputeLearning posts recompute", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({ has_learning_data: false });
    await recomputeLearning(api);
    expect(post).toHaveBeenCalledWith("/learning/recompute");
  });

  it("generateLearningInsights posts generate-insights", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue([]);
    await generateLearningInsights(api);
    expect(post).toHaveBeenCalledWith("/learning/generate-insights");
  });

  it("acknowledgeInsight posts insight path", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({ acknowledged: true });
    await acknowledgeInsight(api, "ins-1");
    expect(post).toHaveBeenCalledWith("/learning/insights/ins-1/acknowledge");
  });

  it("getItemPairSuggestions passes limit", async () => {
    const { get, api } = mockApi();
    get.mockResolvedValue([]);
    await getItemPairSuggestions(api, "item-1", 8);
    expect(get).toHaveBeenCalledWith("/learning/item-pairs/item-1", { params: { limit: "8" } });
  });
});
