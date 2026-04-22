import { ApiError, NetworkError } from './errors'
import type {
  ApiClient,
  ApiClientConfig,
  ApiHeaders,
  ApiQueryParams,
  ApiRequestOptions,
} from './types'

function normalizeHeaders(headers?: ApiHeaders): ApiHeaders {
  return headers ? { ...headers } : {}
}

function resolveBasePath(config: ApiClientConfig): string {
  return config.bindings?.getBasePath?.() ?? config.basePath ?? ''
}

function encodeQueryParam(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+')
}

function buildQueryString(params?: ApiQueryParams): string {
  if (!params) return ''

  const parts: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue
    parts.push(`${encodeQueryParam(key)}=${encodeQueryParam(String(value))}`)
  }

  return parts.join('&')
}

function buildUrl(basePath: string, endpoint: string, params?: ApiQueryParams): string {
  const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  let url = `${normalizedBase}${normalizedEndpoint}`

  const query = buildQueryString(params)
  if (!query) return url

  url += url.includes('?') ? `&${query}` : `?${query}`
  return url
}

function getErrorMessage(data: unknown, getGenericErrorMessage: () => string): string {
  if (data && typeof data === 'object') {
    const detail = (data as { detail?: unknown }).detail
    if (typeof detail === 'string') return detail
    if (detail && typeof detail === 'object' && typeof (detail as { message?: unknown }).message === 'string') {
      return (detail as { message: string }).message
    }

    const error = (data as { error?: unknown }).error
    if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message
    }
  }

  return getGenericErrorMessage()
}

async function parseErrorData(response: { json(): Promise<unknown> }): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

function isRequestOptions(value: unknown): value is ApiRequestOptions {
  if (!value || typeof value !== 'object') return false

  return Object.keys(value).every((key) => key === 'params' || key === 'headers')
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const getGenericErrorMessage =
    config.getGenericErrorMessage ?? (() => 'An error occurred')
  const getNetworkErrorMessage =
    config.getNetworkErrorMessage ?? (() => 'Unable to connect to server. Please try again.')
  const getOfflineErrorMessage =
    config.getOfflineErrorMessage ?? getNetworkErrorMessage

  async function request<T>(
    endpoint: string,
    options: ApiRequestOptions & { method: string; body?: string | null }
  ): Promise<T> {
    const { params, headers: rawHeaders, body } = options
    const mergedHeaders: ApiHeaders = {
      'Content-Type': 'application/json',
      ...normalizeHeaders(rawHeaders),
    }

    const accessToken = config.bindings?.getAccessToken?.()
    if (accessToken) {
      mergedHeaders.Authorization = `Bearer ${accessToken}`
    }

    const acceptLanguage = config.bindings?.getAcceptLanguage?.()
    if (acceptLanguage) {
      mergedHeaders['Accept-Language'] = acceptLanguage
    }

    const url = buildUrl(resolveBasePath(config), endpoint, params)

    let response
    try {
      response = await config.adapter({
        url,
        method: options.method,
        headers: mergedHeaders,
        body,
      })
    } catch {
      const isOnline = config.isOnline?.()
      throw new NetworkError(isOnline === false ? getOfflineErrorMessage() : getNetworkErrorMessage())
    }

    if (!response.ok) {
      const data = await parseErrorData(response)
      throw new ApiError(getErrorMessage(data, getGenericErrorMessage), response.status, data)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  return {
    get: <T>(endpoint: string, options: ApiRequestOptions = {}) =>
      request<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, data?: unknown, options: ApiRequestOptions = {}) =>
      request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }),

    patch: <T>(endpoint: string, data?: unknown, options: ApiRequestOptions = {}) =>
      request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      }),

    delete: <T>(
      endpoint: string,
      dataOrOptions?: unknown,
      maybeOptions: ApiRequestOptions = {}
    ) => {
      if (isRequestOptions(dataOrOptions) && Object.keys(maybeOptions).length === 0) {
        return request<T>(endpoint, { ...dataOrOptions, method: 'DELETE' })
      }

      return request<T>(endpoint, {
        ...maybeOptions,
        method: 'DELETE',
        body: dataOrOptions === undefined ? undefined : JSON.stringify(dataOrOptions),
      })
    },
  }
}
