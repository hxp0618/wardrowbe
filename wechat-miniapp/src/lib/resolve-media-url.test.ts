import { describe, expect, it } from "vitest";

import { resolveMediaUrlWithBase } from "./resolve-media-url";

describe("resolveMediaUrlWithBase", () => {
  it("returns empty string for nullish", () => {
    expect(resolveMediaUrlWithBase("http://a.com", null)).toBe("");
    expect(resolveMediaUrlWithBase("http://a.com", undefined)).toBe("");
  });

  it("preserves absolute http(s) URLs", () => {
    expect(resolveMediaUrlWithBase("http://a.com", "https://cdn/x.png")).toBe("https://cdn/x.png");
  });

  it("joins origin with leading slash path", () => {
    expect(resolveMediaUrlWithBase("http://api:8000/", "/api/v1/images/x")).toBe("http://api:8000/api/v1/images/x");
  });

  it("strips trailing slash on origin and adds slash for relative path", () => {
    expect(resolveMediaUrlWithBase("http://127.0.0.1:8000", "api/v1/foo")).toBe("http://127.0.0.1:8000/api/v1/foo");
  });
});
