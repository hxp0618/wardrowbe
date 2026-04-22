import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { messages } from '@wardrowbe/shared-i18n'

const authState = vi.hoisted(() => ({
  user: null as null | { display_name?: string; onboarding_completed: boolean },
  isAuthenticated: false,
  isLoading: false,
  error: null as unknown,
  session: null as null | { accessToken?: string },
}))

type NavigateFn = (path: string) => void

const routerState = vi.hoisted(() => {
  let navigateImpl: NavigateFn = () => {}
  return {
    get navigateImpl() {
      return navigateImpl
    },
    set navigateImpl(fn: NavigateFn) {
      navigateImpl = fn
    },
    navigate: vi.fn((path: string) => navigateImpl(path)),
  }
})

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: routerState.navigate,
    replace: routerState.navigate,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: authState.session,
    status: authState.isAuthenticated ? 'authenticated' : 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => authState,
}))

vi.mock('@/lib/hooks/use-family', () => ({
  useCreateFamily: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useJoinFamily: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/lib/hooks/use-preferences', () => ({
  useUpdatePreferences: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/lib/hooks/use-items', () => ({
  useCreateItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { NextIntlClientProvider } from 'next-intl'
import OnboardingPage from '@/app/[locale]/onboarding/page'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <NextIntlClientProvider locale="en" messages={messages.en}>
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}

function RouterHarness({ children }: { children: React.ReactNode }) {
  const [, setPath] = useState('/')
  routerState.navigateImpl = setPath
  return <>{children}</>
}

function consoleMessages(spy: ReturnType<typeof vi.spyOn>) {
  return spy.mock.calls
    .flatMap((call: unknown[]) => call.map((value: unknown) => String(value)))
    .join('\n')
}

describe('request i18n config', () => {
  afterEach(() => {
    vi.doUnmock('@wardrowbe/shared-i18n')
    vi.doUnmock('next-intl/server')
  })

  it('reads locale messages from the shared i18n package', async () => {
    vi.resetModules()
    vi.doMock('next-intl/server', () => ({
      getRequestConfig: (factory: unknown) => factory,
    }))
    vi.doMock('@wardrowbe/shared-i18n', () => ({
      supportedLocales: ['zh', 'en'],
      defaultLocale: 'zh',
      messages: {
        en: {
          __source: 'shared-en',
        },
        zh: {
          __source: 'shared-zh',
        },
      },
    }))

    const { default: getRequestConfig } = await import('../i18n/request')
    const config = await getRequestConfig({
      requestLocale: Promise.resolve('en'),
    })

    expect(config).toMatchObject({
      locale: 'en',
      messages: {
        __source: 'shared-en',
      },
    })
  })

  it('falls back to a real shared message locale when metadata drifts', async () => {
    vi.resetModules()
    vi.doMock('next-intl/server', () => ({
      getRequestConfig: (factory: unknown) => factory,
    }))
    vi.doMock('@wardrowbe/shared-i18n', () => ({
      supportedLocales: ['fr'],
      defaultLocale: 'fr',
      messages: {
        en: {
          __source: 'shared-en',
        },
        zh: {
          __source: 'shared-zh',
        },
      },
    }))

    const { default: getRequestConfig } = await import('../i18n/request')
    const config = await getRequestConfig({
      requestLocale: Promise.resolve('fr'),
    })

    expect(config).toMatchObject({
      locale: 'zh',
      messages: {
        __source: 'shared-zh',
      },
    })
  })

  it('falls back to the first available shared locale when zh is unavailable', async () => {
    vi.resetModules()
    vi.doMock('next-intl/server', () => ({
      getRequestConfig: (factory: unknown) => factory,
    }))
    vi.doMock('@wardrowbe/shared-i18n', () => ({
      supportedLocales: ['fr'],
      defaultLocale: 'fr',
      messages: {
        en: {
          __source: 'shared-en',
        },
      },
    }))

    const { default: getRequestConfig } = await import('../i18n/request')
    const config = await getRequestConfig({
      requestLocale: Promise.resolve('fr'),
    })

    expect(config).toMatchObject({
      locale: 'en',
      messages: {
        __source: 'shared-en',
      },
    })
  })
})

describe('OnboardingPage redirects', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = null
    authState.isAuthenticated = false
    authState.isLoading = false
    authState.error = null
    authState.session = null
    routerState.navigateImpl = () => {}
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('redirects unauthenticated users without a render-phase router update', async () => {
    renderWithProviders(
      <RouterHarness>
        <OnboardingPage />
      </RouterHarness>
    )

    await waitFor(() => {
      expect(routerState.navigate).toHaveBeenCalledWith('/login')
    })

    expect(consoleMessages(consoleErrorSpy)).not.toContain('Cannot update a component')
  })

  it('redirects completed users without a render-phase router update', async () => {
    authState.user = {
      display_name: 'Dev User',
      onboarding_completed: true,
    }
    authState.isAuthenticated = true
    authState.session = { accessToken: 'token' }

    renderWithProviders(
      <RouterHarness>
        <OnboardingPage />
      </RouterHarness>
    )

    await waitFor(() => {
      expect(routerState.navigate).toHaveBeenCalledWith('/dashboard')
    })

    expect(consoleMessages(consoleErrorSpy)).not.toContain('Cannot update a component')
  })
})
