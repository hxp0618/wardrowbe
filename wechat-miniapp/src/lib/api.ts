import Taro from '@tarojs/taro'

import { createApiClient } from '@wardrowbe/shared-api'
import type { ApiTransportRequest } from '@wardrowbe/shared-api'

import { useAuthStore } from '../stores/auth'

const API_BASE_PATH = '/api/v1'
const DEFAULT_API_ORIGIN = 'https://wardrowbe.191027.xyz'
const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'

export function resolveApiOrigin(): string {
  const rawBaseUrl = process.env.TARO_APP_API_BASE_URL?.trim() || DEFAULT_API_ORIGIN
  return rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl
}

export function resolveAccessToken(
  storage: Pick<typeof Taro, 'getStorageSync'> = Taro
): string | null {
  const inMemoryToken = useAuthStore.getState().accessToken
  if (inMemoryToken) {
    return inMemoryToken
  }

  try {
    const storedToken = storage.getStorageSync<string | undefined>(ACCESS_TOKEN_STORAGE_KEY)
    return typeof storedToken === 'string' && storedToken.length > 0 ? storedToken : null
  } catch {
    return null
  }
}

const adapter = async (request: ApiTransportRequest) => {
  const response = await Taro.request({
    url: `${resolveApiOrigin()}${request.url}`,
    method: request.method as keyof Taro.request.Method,
    header: request.headers,
    data: request.body ? JSON.parse(request.body) : undefined,
  })

  return {
    ok: response.statusCode >= 200 && response.statusCode < 300,
    status: response.statusCode,
    json: async () => response.data,
  }
}

export const api = createApiClient({
  adapter,
  basePath: API_BASE_PATH,
  bindings: {
    getAccessToken: () => resolveAccessToken(),
    getAcceptLanguage: () => 'zh-CN',
  },
})
