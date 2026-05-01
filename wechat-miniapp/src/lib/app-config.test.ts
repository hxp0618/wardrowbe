import { afterEach, describe, expect, it, vi } from 'vitest'

describe('miniapp app config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('uses local backend defaults for DevTools development', async () => {
    vi.stubEnv('TARO_APP_API_BASE_URL', '')

    const { API_BASE_PATH, DEFAULT_API_ORIGIN, resolveApiOrigin } = await import('./app-config')

    expect(API_BASE_PATH).toBe('/api/v1')
    expect(DEFAULT_API_ORIGIN).toBe('http://127.0.0.1:8000')
    expect(resolveApiOrigin()).toBe('http://127.0.0.1:8000')
  })

  it('trims configured origins and builds business API URLs', async () => {
    vi.stubEnv('TARO_APP_API_BASE_URL', 'https://api.example.com/')

    const { buildBusinessApiUrl, resolveApiOrigin } = await import('./app-config')

    expect(resolveApiOrigin()).toBe('https://api.example.com')
    expect(buildBusinessApiUrl('/items')).toBe('https://api.example.com/api/v1/items')
    expect(buildBusinessApiUrl('items/item-1/images')).toBe(
      'https://api.example.com/api/v1/items/item-1/images'
    )
  })
})
