import { describe, expect, it } from "vitest";

import { messagesEn, messagesZh } from "./index";

const API_MESSAGE_KEYS = [
  "offline",
  "unableToConnect",
  "generic",
  "createItemFailed",
  "uploadImageFailed",
  "invalidServerResponse",
  "bulkUploadFailed",
  "uploadCancelled",
] as const;

function assertApiMessages(m: typeof messagesEn) {
  const api = m.errors?.api;
  expect(api).toBeDefined();
  for (const key of API_MESSAGE_KEYS) {
    expect(typeof api[key]).toBe("string");
    expect((api[key] as string).length).toBeGreaterThan(0);
  }
}

describe("shared-i18n locale bundles", () => {
  it("en and zh expose errors.api keys used by the API client", () => {
    assertApiMessages(messagesEn);
    assertApiMessages(messagesZh);
  });

  it("en and zh have the same top-level message keys", () => {
    const enKeys = Object.keys(messagesEn).sort();
    const zhKeys = Object.keys(messagesZh).sort();
    expect(zhKeys).toEqual(enKeys);
  });

  it("includes common and taxonomy sections", () => {
    expect(messagesEn.common?.appName).toBeDefined();
    expect(messagesEn.taxonomy?.colors?.black).toBeDefined();
    expect(messagesZh.common?.appName).toBeDefined();
    expect(messagesZh.taxonomy?.colors?.black).toBeDefined();
  });
});
