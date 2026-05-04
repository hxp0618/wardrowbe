// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const redirectTo = vi.fn()
const setStorageSync = vi.fn()
const switchTab = vi.fn()
const bootstrapMiniappSession = vi.fn()
const getMiniappAuthAvailability = vi.fn()

vi.mock('@tarojs/components', () => ({
  Input: ({
    onInput,
    placeholder,
    value,
  }: {
    onInput?: (event: { detail: { value: string } }) => void
    placeholder?: string
    value?: string
  }) => (
    <input
      aria-label={placeholder}
      onChange={(event) => onInput?.({ detail: { value: event.currentTarget.value } })}
      placeholder={placeholder}
      value={value || ''}
    />
  ),
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  View: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode
    onClick?: () => void
  }) => <div onClick={onClick}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getCurrentInstance: () => ({ router: { params: {} } }),
    redirectTo,
    setStorageSync,
    switchTab,
  },
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    fetchQuery: vi.fn(),
    prefetchQuery: vi.fn(),
    removeQueries: vi.fn(),
  }),
}))

vi.mock('../../components/empty-state', () => ({
  EmptyState: ({ description, title }: { description: string; title: string }) => (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: ({
    children,
    subtitle,
    title,
  }: {
    children?: React.ReactNode
    subtitle?: string
    title?: string
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </main>
  ),
}))

vi.mock('../../components/section-card', () => ({
  SectionCard: ({ children, title }: { children?: React.ReactNode; title: string }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../../services/auth', () => ({
  getMiniappAuthAvailability,
  loginWithDev: vi.fn(),
  loginWithWechatCode: vi.fn(),
}))

vi.mock('../../services/session-bootstrap', () => ({
  bootstrapMiniappSession,
}))

describe('completeAuthenticatedLogin', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    redirectTo.mockReset()
    setStorageSync.mockReset()
    switchTab.mockReset()
    bootstrapMiniappSession.mockReset()
    getMiniappAuthAvailability.mockResolvedValue({
      devEnabled: true,
      message: null,
      wechatEnabled: true,
    })
  })

  it('clears cached miniapp queries before bootstrapping the logged-in session', async () => {
    const removeQueries = vi.fn()
    bootstrapMiniappSession.mockImplementation(async () => {
      expect(removeQueries).toHaveBeenCalledWith({ queryKey: ['miniapp'] })
      return { onboarding_completed: true }
    })

    const { completeAuthenticatedLogin } = await import('./index')

    await completeAuthenticatedLogin({
      session: {
        id: 'user-1',
        email: 'dev@wardrobe.local',
        displayName: 'Dev User',
        isNewUser: false,
        onboardingCompleted: true,
        accessToken: 'new-token',
      },
      queryClient: {
        fetchQuery: vi.fn(),
        prefetchQuery: vi.fn(),
        removeQueries,
      },
      setAccessToken: vi.fn(),
      setHydrated: vi.fn(),
    })

    expect(switchTab).toHaveBeenCalledWith({ url: '/pages/dashboard/index' })
  })

  it('does not render a decorative W brand tile before the login form', async () => {
    const { default: LoginPage } = await import('./index')

    render(<LoginPage />)

    expect(screen.queryByText('W')).toBeNull()
    expect(screen.getByText('login_welcome_title')).toBeTruthy()
  })
})
