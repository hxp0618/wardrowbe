import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const authState = vi.hoisted(() => ({
  user: null as null | { display_name?: string; onboarding_completed: boolean },
  isAuthenticated: false,
  isLoading: false,
  error: null as unknown,
  session: null as null | { accessToken?: string },
}))

const routerState = vi.hoisted(() => ({
  navigateImpl: ((_path: string) => {}) as (path: string) => void,
  navigate: vi.fn((path: string) => routerState.navigateImpl(path)),
}))

vi.mock('next/navigation', () => ({
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

import OnboardingPage from '@/app/onboarding/page'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

function RouterHarness({ children }: { children: React.ReactNode }) {
  const [, setPath] = useState('/')
  routerState.navigateImpl = setPath
  return <>{children}</>
}

function consoleMessages(spy: ReturnType<typeof vi.spyOn>) {
  return spy.mock.calls
    .flatMap((call) => call.map((value) => String(value)))
    .join('\n')
}

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
