import Taro from '@tarojs/taro'

import { createApiClient } from '@wardrowbe/shared-api'
import type { ApiTransportRequest } from '@wardrowbe/shared-api'

import { useAuthStore } from '../stores/auth'

import { API_BASE_PATH, normalizeBusinessApiResourceUrls, resolveApiOrigin } from './app-config'
import { ACCESS_TOKEN_STORAGE_KEY } from './storage'

export { resolveApiOrigin }

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
    json: async () => normalizeBusinessApiResourceUrls(response.data),
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
