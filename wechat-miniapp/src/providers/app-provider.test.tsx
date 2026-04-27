import { beforeEach, describe, expect, it, vi } from 'vitest'

const getStorageSync = vi.fn()

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync,
  },
}))

describe('AppProvider auth restore', () => {
  beforeEach(async () => {
    getStorageSync.mockReset()
    vi.resetModules()
    const { useAuthStore } = await import('../stores/auth')
    useAuthStore.setState({
      accessToken: null,
      appearance: 'dark',
      hydrated: false,
    })
  })

  it('restores access token and appearance from local storage into the auth store', async () => {
    getStorageSync.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'persisted-token'
      if (key === 'appearance') return 'light'
      return undefined
    })

    const { restoreAccessTokenSession } = await import('./app-provider')
    const { useAuthStore } = await import('../stores/auth')

    expect(restoreAccessTokenSession()).toBe('persisted-token')
    expect(getStorageSync).toHaveBeenCalledWith('accessToken')
    expect(getStorageSync).toHaveBeenCalledWith('appearance')
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'persisted-token',
      appearance: 'light',
      hydrated: true,
    })
  })

  it('does not depend on locale storage anymore', async () => {
    getStorageSync.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'persisted-token'
      if (key === 'appearance') return 'light'
      return undefined
    })

    const { restoreAccessTokenSession } = await import('./app-provider')

    expect(restoreAccessTokenSession()).toBe('persisted-token')
    expect(getStorageSync).toHaveBeenCalledWith('accessToken')
    expect(getStorageSync).toHaveBeenCalledWith('appearance')
    expect(getStorageSync).not.toHaveBeenCalledWith('locale')
  })

  it('defaults to light appearance when no stored preference exists', async () => {
    getStorageSync.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'persisted-token'
      if (key === 'appearance') return undefined
      return undefined
    })

    const { restoreAccessTokenSession } = await import('./app-provider')
    const { useAuthStore } = await import('../stores/auth')

    expect(restoreAccessTokenSession()).toBe('persisted-token')
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'persisted-token',
      appearance: 'light',
      hydrated: true,
    })
  })

  it('still hydrates the auth store when storage access throws', async () => {
    getStorageSync.mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    const { restoreAccessTokenSession } = await import('./app-provider')
    const { useAuthStore } = await import('../stores/auth')

    expect(restoreAccessTokenSession()).toBeNull()
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      appearance: 'light',
      hydrated: true,
    })
  })
})
