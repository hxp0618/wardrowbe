import Taro from "@tarojs/taro";

import { clearAccessToken, getAccessToken } from "@/lib/auth-storage";
import { API_BASE_URL } from "@/lib/config";

const API_BASE_PATH = "/api/v1";

type RequestMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  params?: Record<string, string>;
  headers?: Record<string, string>;
  /** Override default JSON Content-Type (e.g. for future multipart). */
  skipJsonContentType?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message?: string) {
    super(message ?? "网络不可用");
    this.name = "NetworkError";
  }
}

let acceptLanguageHeader: string | null = "zh";

export function setApiAcceptLanguage(locale: string | null) {
  acceptLanguageHeader = locale;
}

function parseErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "请求失败";
  }
  const d = data as Record<string, unknown>;
  const detail = d.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (detail && typeof detail === "object" && "message" in detail) {
    const m = (detail as { message?: unknown }).message;
    if (typeof m === "string") {
      return m;
    }
  }
  const err = d.error;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") {
      return m;
    }
  }
  return "请求失败";
}

async function requestJson<T>(
  method: RequestMethod,
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers = {}, skipJsonContentType } = options;
  let url = `${API_BASE_URL}${API_BASE_PATH}${endpoint}`;
  if (params) {
    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    url += `?${qs}`;
  }

  const mergedHeaders: Record<string, string> = { ...headers };
  if (!skipJsonContentType && method !== "GET") {
    mergedHeaders["Content-Type"] = "application/json";
  }
  const token = getAccessToken();
  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }
  if (acceptLanguageHeader) {
    mergedHeaders["Accept-Language"] = acceptLanguageHeader;
  }

  try {
    const res = await Taro.request({
      url,
      method,
      data: body !== undefined ? body : undefined,
      header: mergedHeaders,
    });
    const status = res.statusCode;
    if (status === 401) {
      clearAccessToken();
      try {
        Taro.removeStorageSync("wardrowbe_access_token");
      } catch {
        /* ignore */
      }
      const inst = Taro.getCurrentInstance();
      const path = inst.router?.path || "";
      if (path && !path.includes("pages/login")) {
        const normalized = path.startsWith("/") ? path : `/${path}`;
        try {
          Taro.setStorageSync("wardrowbe_post_login_redirect", normalized);
        } catch {
          /* ignore */
        }
        void Taro.reLaunch({ url: "/pages/login/index" });
      }
    }
    if (status === 204) {
      return undefined as T;
    }
    if (!status || status < 200 || status >= 300) {
      const data = res.data;
      throw new ApiError(parseErrorMessage(data), status, data);
    }
    return res.data as T;
  } catch (e) {
    if (e instanceof ApiError) {
      throw e;
    }
    throw new NetworkError();
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    requestJson<T>("GET", endpoint, undefined, options),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    requestJson<T>("POST", endpoint, data, options),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    requestJson<T>("PATCH", endpoint, data, options),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    requestJson<T>("DELETE", endpoint, undefined, options),
};
