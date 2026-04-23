import { describe, expect, it, vi } from "vitest";

import {
  cloneToLookbook,
  createStudioOutfit,
  createWoreInstead,
  patchOutfit,
  wearTodayOutfit,
} from "./studio";
import type { WardrowbeApi } from "./types";

function mockApi() {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  const del = vi.fn();
  return { get, post, patch, delete: del, api: { get, post, patch, delete: del } as WardrowbeApi };
}

describe("studio service", () => {
  it("createStudioOutfit posts /outfits/studio", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({ id: "1" });
    await createStudioOutfit(api, { items: ["a"], occasion: "casual" });
    expect(post).toHaveBeenCalledWith("/outfits/studio", { items: ["a"], occasion: "casual" });
  });

  it("wearTodayOutfit posts wear-today", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({});
    await wearTodayOutfit(api, "tpl", {});
    expect(post).toHaveBeenCalledWith("/outfits/tpl/wear-today", {});
  });

  it("patchOutfit patches outfit", async () => {
    const { patch, api } = mockApi();
    patch.mockResolvedValue({});
    await patchOutfit(api, "o1", { name: "X" });
    expect(patch).toHaveBeenCalledWith("/outfits/o1", { name: "X" });
  });

  it("cloneToLookbook posts clone", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({});
    await cloneToLookbook(api, "s1", { name: "LB" });
    expect(post).toHaveBeenCalledWith("/outfits/s1/clone-to-lookbook", { name: "LB" });
  });

  it("createWoreInstead posts wore-instead", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({});
    await createWoreInstead(api, "orig", { items: ["x"] });
    expect(post).toHaveBeenCalledWith("/outfits/orig/wore-instead", { items: ["x"] });
  });
});
