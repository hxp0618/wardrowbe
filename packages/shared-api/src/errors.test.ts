import { describe, expect, it } from "vitest";

import { ApiError, getErrorMessage, isErrorHandled, parseApiErrorMessage } from "./errors";

describe("parseApiErrorMessage", () => {
  it("returns fallback for non-object", () => {
    expect(parseApiErrorMessage(null, "fb")).toBe("fb");
    expect(parseApiErrorMessage("x", "fb")).toBe("fb");
  });

  it("reads string detail", () => {
    expect(parseApiErrorMessage({ detail: "Not found" }, "fb")).toBe("Not found");
  });

  it("reads detail.message object", () => {
    expect(parseApiErrorMessage({ detail: { message: "Bad" } }, "fb")).toBe("Bad");
  });

  it("reads error.message object", () => {
    expect(parseApiErrorMessage({ error: { message: "Oops" } }, "fb")).toBe("Oops");
  });
});

describe("getErrorMessage", () => {
  it("returns ApiError message for 4xx", () => {
    expect(getErrorMessage(new ApiError("nope", 400, {}), "fb")).toBe("nope");
  });

  it("returns fallback for 5xx ApiError", () => {
    expect(getErrorMessage(new ApiError("srv", 500, {}), "fb")).toBe("fb");
  });
});

describe("isErrorHandled", () => {
  it("tracks object passed to getErrorMessage", () => {
    const err = new ApiError("x", 400, {});
    expect(isErrorHandled(err)).toBe(false);
    getErrorMessage(err, "fb");
    expect(isErrorHandled(err)).toBe(true);
  });
});
