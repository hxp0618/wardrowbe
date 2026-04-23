import { describe, expect, it, vi } from "vitest";

import { getPreferences, resetPreferences, testAIEndpoint, updatePreferences } from "./preferences";
import type { WardrowbeApi } from "./types";

function mockApi() {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  return { get, post, patch, api: { get, post, patch, delete: vi.fn() } as WardrowbeApi };
}

describe("preferences service", () => {
  it("getPreferences uses /users/me/preferences", async () => {
    const { get, api } = mockApi();
    get.mockResolvedValue({});
    await getPreferences(api);
    expect(get).toHaveBeenCalledWith("/users/me/preferences");
  });

  it("updatePreferences patches partial body", async () => {
    const { patch, api } = mockApi();
    patch.mockResolvedValue({});
    await updatePreferences(api, { default_occasion: "formal" });
    expect(patch).toHaveBeenCalledWith("/users/me/preferences", { default_occasion: "formal" });
  });

  it("resetPreferences posts reset", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({});
    await resetPreferences(api);
    expect(post).toHaveBeenCalledWith("/users/me/preferences/reset");
  });

  it("testAIEndpoint posts url", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({ status: "connected" });
    await testAIEndpoint(api, "http://localhost:11434/v1");
    expect(post).toHaveBeenCalledWith("/users/me/preferences/test-ai-endpoint", {
      url: "http://localhost:11434/v1",
    });
  });
});
