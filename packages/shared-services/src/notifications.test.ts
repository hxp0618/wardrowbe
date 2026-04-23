import { describe, expect, it, vi } from "vitest";

import { listNotificationHistory } from "./notifications";
import type { WardrowbeApi } from "./types";

describe("listNotificationHistory", () => {
  it("passes limit as query param", async () => {
    const get = vi.fn().mockResolvedValue([]);
    const api = { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as WardrowbeApi;

    await listNotificationHistory(api, 25);

    expect(get).toHaveBeenCalledWith("/notifications/history", { params: { limit: "25" } });
  });
});
