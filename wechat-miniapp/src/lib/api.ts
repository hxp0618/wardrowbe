import Taro from '@tarojs/taro'

import { createApiClient } from '@wardrowbe/shared-api'
import type { ApiTransportRequest } from '@wardrowbe/shared-api'

import { useAuthStore } from '../stores/auth'

const API_BASE_PATH = '/api/v1'
const DEFAULT_API_ORIGIN = 'http://127.0.0.1:8000'

export function resolveApiOrigin(): string {
  const rawBaseUrl = process.env.TARO_APP_API_BASE_URL?.trim() || DEFAULT_API_ORIGIN
  return rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl
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
    getAccessToken: () => useAuthStore.getState().accessToken,
    getAcceptLanguage: () => useAuthStore.getState().locale,
  },
})
