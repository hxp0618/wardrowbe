import {
  ApiError,
  NetworkError,
  createApiClient,
  getErrorMessage,
  isErrorHandled,
} from "@wardrowbe/shared-api";

import { getApiMessage } from "@/lib/api-messages";

const apiOrigin =
  typeof window !== "undefined"
    ? ""
    : process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "";

let accessToken: string | null = null;
let acceptLanguageHeader: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Pass UI locale (e.g. from next-intl) so API error messages match the user's language. */
export function setApiAcceptLanguage(locale: string | null) {
  acceptLanguageHeader = locale;
}

const client = createApiClient({
  apiOrigin,
  getAccessToken: () => accessToken,
  getAcceptLanguage: () => acceptLanguageHeader,
  getNetworkMessages: () => ({
    offline: getApiMessage("offline"),
    unableToConnect: getApiMessage("unableToConnect"),
    generic: getApiMessage("generic"),
  }),
  credentials: typeof window !== "undefined" ? "include" : "omit",
  isOnline: typeof navigator !== "undefined" ? () => navigator.onLine : undefined,
});

export const api = {
  get: client.get,
  post: client.post,
  patch: client.patch,
  delete: client.delete,
};

export { ApiError, NetworkError, getErrorMessage, isErrorHandled };
