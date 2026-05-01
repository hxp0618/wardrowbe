// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '../stores/auth'

import { useAuthQueryEnabled } from './auth-query'

describe('useAuthQueryEnabled', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      appearance: 'light',
      hydrated: false,
    })
  })

  it('updates when the auth session hydrates after the hook is mounted', () => {
    const { result } = renderHook(() => useAuthQueryEnabled())

    expect(result.current).toBe(false)

    act(() => {
      useAuthStore.setState({
        accessToken: 'session-token',
        hydrated: true,
      })
    })

    expect(result.current).toBe(true)
  })

  it('keeps queries disabled when the caller disables the hook', () => {
    useAuthStore.setState({
      accessToken: 'session-token',
      hydrated: true,
    })

    const { result } = renderHook(() => useAuthQueryEnabled(false))

    expect(result.current).toBe(false)
  })
})
