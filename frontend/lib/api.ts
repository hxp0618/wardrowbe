import { getApiMessage } from '@/lib/api-messages'
import {
  ApiError,
  NetworkError,
  createApiClient,
  type ApiRequestOptions,
} from '@wardrowbe/shared-api'
import { createWebFetchAdapter } from '@wardrowbe/shared-api/web'

const API_BASE_PATH = '/api/v1'

export type FetchOptions = ApiRequestOptions

let accessToken: string | null = null
let acceptLanguageHeader: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setApiAcceptLanguage(locale: string | null) {
  acceptLanguageHeader = locale
}

function isBrowserOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

export const api = createApiClient({
  basePath: API_BASE_PATH,
  adapter: createWebFetchAdapter({ credentials: 'include' }),
  bindings: {
    getAccessToken: () => accessToken,
    getAcceptLanguage: () => acceptLanguageHeader,
  },
  isOnline: isBrowserOnline,
  getGenericErrorMessage: () => getApiMessage('generic'),
  getNetworkErrorMessage: () => getApiMessage('unableToConnect'),
  getOfflineErrorMessage: () => getApiMessage('offline'),
})

const handledErrors = new WeakSet<object>()

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') handledErrors.add(error)
  if (error instanceof ApiError && error.status < 500) return error.message
  return fallback
}

export function isErrorHandled(error: unknown): boolean {
  return error !== null && typeof error === 'object' && handledErrors.has(error)
}

export { ApiError, NetworkError }
