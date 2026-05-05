// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  useAuthGuard: vi.fn(),
}))

vi.mock('../hooks/use-auth-guard', () => ({
  useAuthGuard: mocks.useAuthGuard,
}))

import { AuthGuardedPage } from './auth-guarded-page'

describe('AuthGuardedPage', () => {
  afterEach(() => {
    cleanup()
    mocks.useAuthGuard.mockReset()
  })

  it('renders children when the auth guard says rendering is allowed', () => {
    mocks.useAuthGuard.mockReturnValue(true)

    render(
      <AuthGuardedPage>
        <span>guarded body</span>
      </AuthGuardedPage>
    )

    expect(screen.getByText('guarded body')).toBeTruthy()
  })

  it('renders nothing when the auth guard short-circuits', () => {
    mocks.useAuthGuard.mockReturnValue(false)

    const { container } = render(
      <AuthGuardedPage>
        <span>guarded body</span>
      </AuthGuardedPage>
    )

    expect(container.textContent).toBe('')
  })

  it('forwards the loginPageUrl override to useAuthGuard', () => {
    mocks.useAuthGuard.mockReturnValue(true)

    render(
      <AuthGuardedPage loginPageUrl='/pages/login/index?inviteToken=abc'>
        <span>guarded body</span>
      </AuthGuardedPage>
    )

    expect(mocks.useAuthGuard).toHaveBeenCalledWith('/pages/login/index?inviteToken=abc')
  })
})
