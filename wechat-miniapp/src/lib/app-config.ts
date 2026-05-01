import appConfig from './app-config.json'

export const API_BASE_PATH = appConfig.apiBasePath
export const DEFAULT_API_ORIGIN = appConfig.defaultApiOrigin

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function resolveApiOrigin(rawBaseUrl = process.env.TARO_APP_API_BASE_URL): string {
  return trimTrailingSlash(rawBaseUrl?.trim() || DEFAULT_API_ORIGIN)
}

export function buildBusinessApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${resolveApiOrigin()}${API_BASE_PATH}${normalizedEndpoint}`
}

export function resolveBusinessApiResourceUrl(value: string): string {
  if (!value.startsWith(`${API_BASE_PATH}/`)) return value

  return `${resolveApiOrigin()}${value}`
}

export function normalizeBusinessApiResourceUrls(value: unknown): unknown {
  if (typeof value === 'string') {
    return resolveBusinessApiResourceUrl(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeBusinessApiResourceUrls(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      normalizeBusinessApiResourceUrls(entry),
    ])
  )
}
