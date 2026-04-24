import { beforeEach, describe, expect, it, vi } from 'vitest'

const getWindowInfo = vi.fn()
const getAppBaseInfo = vi.fn()
const getMenuButtonBoundingClientRect = vi.fn()

vi.mock('@tarojs/components', () => ({
  Picker: 'picker',
  Text: 'text',
  View: 'view',
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getWindowInfo,
    getAppBaseInfo,
    getMenuButtonBoundingClientRect,
  },
}))

vi.mock('../hooks/use-user', () => ({
  useUserProfile: () => ({ data: null }),
}))

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({ t: () => 'Settings' }),
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: (selector: (state: {
    locale: 'zh'
    appearance: 'dark'
    setLocale: () => void
    setAppearance: () => void
    setAccessToken: () => void
  }) => unknown) =>
    selector({
      locale: 'zh',
      appearance: 'dark',
      setLocale: () => undefined,
      setAppearance: () => undefined,
      setAccessToken: () => undefined,
    }),
}))

describe('getHeaderMetrics', () => {
  beforeEach(() => {
    getWindowInfo.mockReset()
    getAppBaseInfo.mockReset()
    getMenuButtonBoundingClientRect.mockReset()
  })

  it('falls back to safe default metrics when platform APIs throw', async () => {
    getWindowInfo.mockImplementation(() => {
      throw new Error('timeout')
    })
    getAppBaseInfo.mockImplementation(() => {
      throw new Error('timeout')
    })
    getMenuButtonBoundingClientRect.mockImplementation(() => {
      throw new Error('timeout')
    })

    const { getHeaderMetrics } = await import('./app-header')

    expect(getHeaderMetrics()).toEqual({
      paddingTop: '28px',
      contentHeight: '44px',
    })
  })
})
