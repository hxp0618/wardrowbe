import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from './auth'

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      appearance: 'light',
      hydrated: false,
    })
  })

  it('defaults to light appearance for a fresh session', () => {
    expect(useAuthStore.getInitialState()).toMatchObject({
      appearance: 'light',
    })
  })

  it('updates token, appearance and hydration state', () => {
    useAuthStore.getState().setAccessToken('token-1')
    useAuthStore.getState().setAppearance('light')
    useAuthStore.getState().setHydrated(true)

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'token-1',
      appearance: 'light',
      hydrated: true,
    })
  })
})
