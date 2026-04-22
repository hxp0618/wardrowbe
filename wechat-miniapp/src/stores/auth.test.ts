import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from './auth'

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      locale: 'zh',
      hydrated: false,
    })
  })

  it('updates token, locale and hydration state', () => {
    useAuthStore.getState().setAccessToken('token-1')
    useAuthStore.getState().setLocale('en')
    useAuthStore.getState().setHydrated(true)

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'token-1',
      locale: 'en',
      hydrated: true,
    })
  })
})
