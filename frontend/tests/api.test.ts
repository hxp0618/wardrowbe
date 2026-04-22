import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiClient, ApiError, NetworkError } from '@wardrowbe/shared-api'
import { createWebFetchAdapter } from '@wardrowbe/shared-api/web'
import {
  api,
  getAccessToken,
  getErrorMessage,
  isErrorHandled,
  setAccessToken,
  setApiAcceptLanguage,
} from '@/lib/api'

describe('shared-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves runtime bindings when the request is made', async () => {
    let token: string | null = 'initial-token'
    let locale: string | null = 'zh-CN'
    const adapter = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })

    const client = createApiClient({
      basePath: '/api/v1',
      adapter,
      bindings: {
        getAccessToken: () => token,
        getAcceptLanguage: () => locale,
      },
      getGenericErrorMessage: () => 'Generic error',
      getNetworkErrorMessage: () => 'Network error',
      getOfflineErrorMessage: () => 'Offline error',
    })

    token = 'runtime-token'
    locale = 'en-US'

    await client.get('/runtime-test', {
      params: { page: '1' },
    })

    expect(adapter).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/v1/runtime-test?page=1',
        headers: expect.objectContaining({
          Authorization: 'Bearer runtime-token',
          'Accept-Language': 'en-US',
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('returns undefined for 204 responses', async () => {
    const client = createApiClient({
      basePath: '/api/v1',
      adapter: vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: vi.fn(),
      }),
      getGenericErrorMessage: () => 'Generic error',
      getNetworkErrorMessage: () => 'Network error',
    })

    await expect(client.delete('/items/1')).resolves.toBeUndefined()
  })

  it('throws ApiError with parsed server details', async () => {
    const client = createApiClient({
      basePath: '/api/v1',
      adapter: vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: { message: 'Validation failed' } }),
      }),
      getGenericErrorMessage: () => 'Generic error',
      getNetworkErrorMessage: () => 'Network error',
    })

    await expect(client.post('/items', { name: '' })).rejects.toMatchObject({
      message: 'Validation failed',
      status: 422,
    })
  })

  it('throws NetworkError with offline message when the runtime reports offline', async () => {
    const client = createApiClient({
      basePath: '/api/v1',
      adapter: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
      isOnline: () => false,
      getGenericErrorMessage: () => 'Generic error',
      getNetworkErrorMessage: () => 'Network error',
      getOfflineErrorMessage: () => 'Offline error',
    })

    await expect(client.get('/test')).rejects.toMatchObject({
      name: 'NetworkError',
      message: 'Offline error',
    })
  })

  it('web adapter forwards request details to fetch and applies configured credentials', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })

    const adapter = createWebFetchAdapter({
      fetch: fetchImpl,
      credentials: 'include',
    })
    await adapter({
      url: '/api/v1/test',
      method: 'PATCH',
      headers: { Authorization: 'Bearer token' },
      body: '{"ok":true}',
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/v1/test',
      expect.objectContaining({
        method: 'PATCH',
        headers: { Authorization: 'Bearer token' },
        body: '{"ok":true}',
        credentials: 'include',
      })
    )
  })
})

describe('frontend api runtime binding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAccessToken(null)
    setApiAcceptLanguage(null)
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
  })

  it('keeps the access token getter in sync with the runtime binding', () => {
    expect(getAccessToken()).toBeNull()
    setAccessToken('test-token')
    expect(getAccessToken()).toBe('test-token')
  })

  it('makes a successful GET request with credentials included', async () => {
    const mockData = { id: 1, name: 'Test' }
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    } as Response)

    await expect(api.get('/test')).resolves.toEqual(mockData)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/test',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      })
    )
  })

  it('includes authorization and accept-language headers from runtime state', async () => {
    setAccessToken('test-token')
    setApiAcceptLanguage('zh-CN')
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)

    await api.get('/test')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Accept-Language': 'zh-CN',
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('appends query params', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)

    await api.get('/test', { params: { page: '1', limit: '10' } })

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/test?page=1&limit=10', expect.any(Object))
  })

  it('sends JSON bodies for POST requests', async () => {
    const payload = { name: 'Test Item' }
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 1, ...payload }),
    } as Response)

    await expect(api.post('/items', payload)).resolves.toEqual({ id: 1, name: 'Test Item' })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    )
  })

  it('sends JSON bodies for DELETE requests when payload is provided', async () => {
    const payload = { item_ids: ['folder-item-1'] }
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response)

    await expect(api.delete('/folders/folder-1/items', payload)).resolves.toEqual({ success: true })
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/folders/folder-1/items',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify(payload),
      })
    )
  })

  it('throws ApiError for non-ok responses', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'Not found' }),
    } as Response)

    await expect(api.get('/not-found')).rejects.toMatchObject({
      message: 'Not found',
      status: 404,
    })
  })

  it('throws NetworkError when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

    await expect(api.get('/test')).rejects.toMatchObject({
      name: 'NetworkError',
      message: 'You appear to be offline. Please check your connection.',
    })
  })

  it('throws NetworkError for connection failures', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(api.get('/test')).rejects.toMatchObject({
      name: 'NetworkError',
      message: 'Unable to connect to server. Please try again.',
    })
  })

  it('handles 204 delete responses', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    } as Response)

    await expect(api.delete('/items/1')).resolves.toBeUndefined()
  })

  it('tracks handled errors for UI fallbacks', () => {
    const clientError = new ApiError('Bad request', 400, {})
    const serverError = new ApiError('Server exploded', 500, {})

    expect(getErrorMessage(clientError, 'Fallback')).toBe('Bad request')
    expect(isErrorHandled(clientError)).toBe(true)

    expect(getErrorMessage(serverError, 'Fallback')).toBe('Fallback')
    expect(isErrorHandled(serverError)).toBe(true)
  })
})
