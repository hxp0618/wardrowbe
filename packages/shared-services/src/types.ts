import type { ApiClient } from "../../shared-api/src/client";

/** Minimal API surface used by services (browser or Taro-bound client). */
export type WardrowbeApi = Pick<ApiClient, "get" | "post" | "patch" | "delete">;
