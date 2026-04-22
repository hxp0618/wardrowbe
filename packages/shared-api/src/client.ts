import type { FetchAdapter } from "./adapters/fetch-adapter";
import { defaultFetchAdapter } from "./adapters/fetch-adapter";
import { ApiError, NetworkError, parseApiErrorMessage } from "./errors";

const API_PREFIX = "/api/v1";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

import type { RequestCredentialsMode } from "./adapters/fetch-adapter";

export interface ApiRequestOptions {
  params?: Record<string, string>;
  headers?: Record<string, string>;
  skipJsonContentType?: boolean;
  credentials?: RequestCredentialsMode;
  /** JSON body for DELETE (non-standard; some Wardrowbe endpoints use it). */
  body?: unknown;
}

export interface ApiNetworkMessages {
  offline: string;
  unableToConnect: string;
  generic: string;
}

export interface CreateApiClientOptions {
  /** Origin only (e.g. http://127.0.0.1:8000) or empty string for same-origin relative URLs. */
  apiOrigin: string;
  fetchAdapter?: FetchAdapter;
  getAccessToken: () => string | null;
  getAcceptLanguage: () => string | null;
  getNetworkMessages: () => ApiNetworkMessages;
  /** Passed to fetch when using default adapter (browser). */
  credentials?: RequestCredentialsMode;
  isOnline?: () => boolean;
  onUnauthorized?: (status: number) => void;
}

function joinUrl(origin: string, path: string): string {
  const o = origin.replace(/\/$/, "");
  if (!o) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${o}${p}`;
}

export function createApiClient(options: CreateApiClientOptions) {
  const {
    apiOrigin,
    fetchAdapter = defaultFetchAdapter,
    getAccessToken,
    getAcceptLanguage,
    getNetworkMessages,
    credentials = "omit",
    isOnline,
    onUnauthorized,
  } = options;

  async function requestJson<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    reqOptions: ApiRequestOptions = {},
  ): Promise<T> {
    const { params, headers = {}, skipJsonContentType, credentials: credOverride, body: bodyOpt } =
      reqOptions;
    let path = `${API_PREFIX}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      path += `?${searchParams.toString()}`;
    }
    const url = joinUrl(apiOrigin, path);

    const mergedHeaders: Record<string, string> = { ...headers };
    const rawBody = bodyOpt !== undefined ? bodyOpt : body;
    const serializedBody =
      rawBody === undefined
        ? undefined
        : typeof rawBody === "string"
          ? rawBody
          : JSON.stringify(rawBody);
    if (!skipJsonContentType && method !== "GET" && serializedBody !== undefined) {
      mergedHeaders["Content-Type"] = "application/json";
    }
    const token = getAccessToken();
    if (token) {
      mergedHeaders.Authorization = `Bearer ${token}`;
    }
    const lang = getAcceptLanguage();
    if (lang) {
      mergedHeaders["Accept-Language"] = lang;
    }

    const msgs = getNetworkMessages();

    try {
      const res = await fetchAdapter({
        url,
        method,
        headers: mergedHeaders,
        body: serializedBody,
        credentials: credOverride ?? credentials,
      });

      if (res.status === 401 && onUnauthorized) {
        onUnauthorized(res.status);
      }

      if (!res.status || res.status < 200 || res.status >= 300) {
        const data = await res.json();
        throw new ApiError(parseApiErrorMessage(data, msgs.generic), res.status, data);
      }

      if (res.status === 204) {
        return undefined as T;
      }

      try {
        return (await res.json()) as T;
      } catch {
        throw new NetworkError(msgs.unableToConnect);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (isOnline && !isOnline()) {
        throw new NetworkError(msgs.offline);
      }
      throw new NetworkError(msgs.unableToConnect);
    }
  }

  return {
    get: <T>(endpoint: string, opts?: ApiRequestOptions) =>
      requestJson<T>("GET", endpoint, undefined, opts),

    post: <T>(endpoint: string, data?: unknown, opts?: ApiRequestOptions) =>
      requestJson<T>("POST", endpoint, data, opts),

    patch: <T>(endpoint: string, data?: unknown, opts?: ApiRequestOptions) =>
      requestJson<T>("PATCH", endpoint, data, opts),

    delete: <T>(endpoint: string, opts?: ApiRequestOptions) =>
      requestJson<T>("DELETE", endpoint, undefined, opts),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
