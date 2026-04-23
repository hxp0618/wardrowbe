import { describe, expect, it, vi } from "vitest";

import { completeOnboarding, getUserProfile, updateUserProfile } from "./users";
import type { WardrowbeApi } from "./types";

function mockApi() {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  return { get, post, patch, api: { get, post, patch, delete: vi.fn() } as WardrowbeApi };
}

describe("users service", () => {
  it("getUserProfile hits /users/me", async () => {
    const { get, api } = mockApi();
    get.mockResolvedValue({ id: "1" });
    await getUserProfile(api);
    expect(get).toHaveBeenCalledWith("/users/me");
  });

  it("updateUserProfile patches body", async () => {
    const { patch, api } = mockApi();
    patch.mockResolvedValue({});
    await updateUserProfile(api, { display_name: "X", timezone: "Asia/Shanghai" });
    expect(patch).toHaveBeenCalledWith("/users/me", { display_name: "X", timezone: "Asia/Shanghai" });
  });

  it("completeOnboarding posts onboarding endpoint", async () => {
    const { post, api } = mockApi();
    post.mockResolvedValue({ onboarding_completed: true });
    await completeOnboarding(api);
    expect(post).toHaveBeenCalledWith("/users/me/onboarding/complete");
  });
});
