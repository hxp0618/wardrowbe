import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tarojs/taro', () => ({
  default: {
    request: vi.fn(),
  },
}))

vi.mock('@wardrowbe/shared-api', () => ({
  createApiClient: vi.fn(() => ({})),
}))

describe('resolveApiOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('falls back to the local backend origin when TARO_APP_API_BASE_URL is not set', async () => {
    vi.stubEnv('TARO_APP_API_BASE_URL', '')

    const { resolveApiOrigin } = await import('./api')

    expect(resolveApiOrigin()).toBe('http://127.0.0.1:8000')
  })

  it('trims a trailing slash from TARO_APP_API_BASE_URL', async () => {
    vi.stubEnv('TARO_APP_API_BASE_URL', 'https://api.example.com/')

    const { resolveApiOrigin } = await import('./api')

    expect(resolveApiOrigin()).toBe('https://api.example.com')
  })
})
