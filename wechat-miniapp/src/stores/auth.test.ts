import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from './auth'

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      locale: 'zh',
      appearance: 'dark',
      hydrated: false,
    })
  })

  it('updates token, locale, appearance and hydration state', () => {
    useAuthStore.getState().setAccessToken('token-1')
    useAuthStore.getState().setLocale('en')
    useAuthStore.getState().setAppearance('light')
    useAuthStore.getState().setHydrated(true)

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'token-1',
      locale: 'en',
      appearance: 'light',
      hydrated: true,
    })
  })
})
