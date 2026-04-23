import Taro from "@tarojs/taro";

import {
  ApiError,
  NetworkError,
  createApiClient,
  getErrorMessage,
  isErrorHandled,
} from "@wardrowbe/shared-api";

import { clearAccessToken, getAccessToken } from "@/lib/auth-storage";
import { API_BASE_URL } from "@/lib/config";
import { taroFetchAdapter } from "@/lib/taro-fetch-adapter";

let acceptLanguageHeader: string | null = "zh";

export function setApiAcceptLanguage(locale: string | null) {
  acceptLanguageHeader = locale;
}

const MSG_ZH = {
  offline: "您似乎处于离线状态，请检查网络连接。",
  unableToConnect: "无法连接到服务器，请稍后重试。",
  generic: "发生错误",
};

const MSG_EN = {
  offline: "You appear to be offline. Please check your connection.",
  unableToConnect: "Unable to connect to server. Please try again.",
  generic: "An error occurred",
};

function networkMessages() {
  const zh = acceptLanguageHeader?.toLowerCase().startsWith("zh");
  return zh ? MSG_ZH : MSG_EN;
}

const client = createApiClient({
  apiOrigin: API_BASE_URL,
  fetchAdapter: taroFetchAdapter,
  getAccessToken,
  getAcceptLanguage: () => acceptLanguageHeader,
  getNetworkMessages: networkMessages,
  onUnauthorized: () => {
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
  },
});

export const api = {
  get: client.get,
  post: client.post,
  patch: client.patch,
  delete: client.delete,
};

export { ApiError, NetworkError, getErrorMessage, isErrorHandled };
