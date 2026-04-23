import { describe, expect, it, vi } from "vitest";

import type { FetchAdapter } from "./adapters/fetch-adapter";
import { ApiError, NetworkError } from "./errors";
import { createApiClient } from "./client";

const msgs = () => ({ offline: "off", unableToConnect: "conn", generic: "gen" });

function makeMockAdapter(handler: (req: { url: string; method: string; headers: Record<string, string>; body?: string }) => { status: number; json: () => Promise<unknown> }): FetchAdapter {
  return async (req) => handler(req);
}

describe("createApiClient", () => {
  it("builds URL with origin, prefix, query, and GET has no body", async () => {
    const adapter = makeMockAdapter((req) => {
      expect(req.url).toBe("http://h/api/v1/items?page=1");
      expect(req.method).toBe("GET");
      expect(req.body).toBeUndefined();
      return { status: 200, json: async () => ({ ok: true }) };
    });
    const client = createApiClient({
      apiOrigin: "http://h",
      fetchAdapter: adapter,
      getAccessToken: () => null,
      getAcceptLanguage: () => null,
      getNetworkMessages: msgs,
    });
    const r = await client.get<{ ok: boolean }>("/items", { params: { page: "1" } });
    expect(r.ok).toBe(true);
  });

  it("adds Bearer and Accept-Language when set", async () => {
    const adapter = makeMockAdapter((req) => {
      expect(req.headers.Authorization).toBe("Bearer t1");
      expect(req.headers["Accept-Language"]).toBe("zh");
      return { status: 200, json: async () => ({}) };
    });
    const client = createApiClient({
      apiOrigin: "",
      fetchAdapter: adapter,
      getAccessToken: () => "t1",
      getAcceptLanguage: () => "zh",
      getNetworkMessages: msgs,
    });
    await client.get("/users/me");
  });

  it("returns undefined for 204", async () => {
    const adapter = makeMockAdapter(() => ({ status: 204, json: async () => ({}) }));
    const client = createApiClient({
      apiOrigin: "http://x",
      fetchAdapter: adapter,
      getAccessToken: () => null,
      getAcceptLanguage: () => null,
      getNetworkMessages: msgs,
    });
    const out = await client.delete<void>("/x");
    expect(out).toBeUndefined();
  });

  it("throws ApiError with parsed body on 422", async () => {
    const adapter = makeMockAdapter(() => ({
      status: 422,
      json: async () => ({ detail: "invalid" }),
    }));
    const client = createApiClient({
      apiOrigin: "http://x",
      fetchAdapter: adapter,
      getAccessToken: () => null,
      getAcceptLanguage: () => null,
      getNetworkMessages: msgs,
    });
    await expect(client.post("/items", {})).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      message: "invalid",
    });
  });

  it("calls onUnauthorized on 401", async () => {
    const on401 = vi.fn();
    const adapter = makeMockAdapter(() => ({
      status: 401,
      json: async () => ({}),
    }));
    const client = createApiClient({
      apiOrigin: "http://x",
      fetchAdapter: adapter,
      getAccessToken: () => "t",
      getAcceptLanguage: () => null,
      getNetworkMessages: msgs,
      onUnauthorized: on401,
    });
    await expect(client.get("/x")).rejects.toBeInstanceOf(ApiError);
    expect(on401).toHaveBeenCalledWith(401);
  });

  it("passes pre-serialized string body on DELETE without double JSON.stringify", async () => {
    const adapter = makeMockAdapter((req) => {
      expect(req.method).toBe("DELETE");
      expect(req.body).toBe('{"item_ids":["a"]}');
      expect(req.headers["Content-Type"]).toBe("application/json");
      return { status: 200, json: async () => ({}) };
    });
    const client = createApiClient({
      apiOrigin: "http://x",
      fetchAdapter: adapter,
      getAccessToken: () => null,
      getAcceptLanguage: () => null,
      getNetworkMessages: msgs,
    });
    await client.delete("/folders/f1/items", { body: JSON.stringify({ item_ids: ["a"] }) });
  });

  it("throws NetworkError when isOnline is false", async () => {
    const adapter = vi.fn().mockRejectedValue(new Error("network"));
    const client = createApiClient({
      apiOrigin: "http://x",
      fetchAdapter: adapter,
      getAccessToken: () => null,
      getAcceptLanguage: () => null,
      getNetworkMessages: msgs,
      isOnline: () => false,
    });
    await expect(client.get("/x")).rejects.toMatchObject({
      name: "NetworkError",
      message: "off",
    });
  });

  it("throws NetworkError when 200 body is invalid JSON", async () => {
    const adapter = makeMockAdapter(() => ({
      status: 200,
      json: async () => {
        throw new SyntaxError("bad json");
      },
    }));
    const client = createApiClient({
      apiOrigin: "http://x",
      fetchAdapter: adapter,
      getAccessToken: () => null,
      getAcceptLanguage: () => null,
      getNetworkMessages: msgs,
    });
    await expect(client.get("/x")).rejects.toMatchObject({
      name: "NetworkError",
      message: "conn",
    });
  });
});
