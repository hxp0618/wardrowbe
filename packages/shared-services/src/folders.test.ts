import { describe, expect, it, vi } from "vitest";

import { listFolders } from "./folders";
import type { WardrowbeApi } from "./types";

describe("listFolders", () => {
  it("GET /folders", async () => {
    const get = vi.fn().mockResolvedValue([]);
    const api = { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as WardrowbeApi;
    await listFolders(api);
    expect(get).toHaveBeenCalledWith("/folders");
  });
});
