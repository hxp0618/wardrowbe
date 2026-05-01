import { describe, expect, it, vi } from 'vitest'

vi.mock('@tarojs/taro', () => ({
  default: {},
}))

describe('miniapp storage helpers', () => {
  it('reads normalized access token and appearance values', async () => {
    const getStorageSync = vi.fn((key: string) => {
      if (key === 'accessToken') return 'stored-token'
      if (key === 'appearance') return 'dark'
      return undefined
    })

    const { getStoredAccessToken, getStoredAppearance } = await import('./storage')
    const storage = {
      getStorageSync: getStorageSync as <T = any>(key: string) => T,
    }

    expect(getStoredAccessToken(storage)).toBe('stored-token')
    expect(getStoredAppearance(storage)).toBe('dark')
  })

  it('writes and clears known storage keys through one helper layer', async () => {
    const setStorageSync = vi.fn()
    const removeStorageSync = vi.fn()

    const { clearStoredAccessToken, setStoredAccessToken, setStoredAppearance } = await import(
      './storage'
    )

    setStoredAccessToken('next-token', { setStorageSync })
    setStoredAppearance('light', { setStorageSync })
    clearStoredAccessToken({ removeStorageSync })

    expect(setStorageSync).toHaveBeenCalledWith('accessToken', 'next-token')
    expect(setStorageSync).toHaveBeenCalledWith('appearance', 'light')
    expect(removeStorageSync).toHaveBeenCalledWith('accessToken')
  })
})
