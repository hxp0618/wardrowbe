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
      locale: 'zh',
      hydrated: false,
    })
  })

  it('restores an access token from local storage into the auth store', async () => {
    getStorageSync.mockReturnValue('persisted-token')

    const { restoreAccessTokenSession } = await import('./app-provider')
    const { useAuthStore } = await import('../stores/auth')

    expect(restoreAccessTokenSession()).toBe('persisted-token')
    expect(getStorageSync).toHaveBeenCalledWith('accessToken')
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'persisted-token',
      hydrated: true,
    })
  })
})
