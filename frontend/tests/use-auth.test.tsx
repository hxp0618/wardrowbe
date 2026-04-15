import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const sessionState = vi.hoisted(() => ({
  data: {
    accessToken: undefined,
    syncError: undefined,
  } as null | { accessToken?: string; syncError?: string },
  status: 'authenticated' as 'authenticated' | 'loading' | 'unauthenticated',
}))

const signOutMock = vi.hoisted(() => vi.fn(() => Promise.resolve()))
const apiGetMock = vi.hoisted(() => vi.fn())
const setAccessTokenMock = vi.hoisted(() => vi.fn())

vi.mock('next-auth/react', () => ({
  useSession: () => sessionState,
  signIn: vi.fn(),
  signOut: signOutMock,
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/lib/api', () => ({
  api: {
    get: apiGetMock,
  },
  setAccessToken: setAccessTokenMock,
  ApiError: class ApiError extends Error {
    status: number

    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

import { useAuth } from '@/lib/hooks/use-auth'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionState.status = 'authenticated'
    sessionState.data = { accessToken: undefined, syncError: undefined }
  })

  it('does not auto sign out when backend sync failed and syncError is present', async () => {
    sessionState.data = {
      accessToken: undefined,
      syncError: 'OIDC token invalid',
    }

    renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(signOutMock).not.toHaveBeenCalled()
    })
  })

  it('auto signs out when authenticated session has no backend token and no syncError', async () => {
    renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false })
    })
  })
})
