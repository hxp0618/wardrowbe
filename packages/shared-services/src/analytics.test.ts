import { describe, expect, it, vi } from "vitest";

import { getAnalytics } from "./analytics";
import type { WardrowbeApi } from "./types";

describe("getAnalytics", () => {
  it("passes days as query string", async () => {
    const get = vi.fn().mockResolvedValue({});
    const api = { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as WardrowbeApi;

    await getAnalytics(api, 14);

    expect(get).toHaveBeenCalledWith("/analytics", { params: { days: "14" } });
  });
});
