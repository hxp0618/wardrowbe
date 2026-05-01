import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const sessionState = vi.hoisted(() => ({
  data: { accessToken: 'token' } as null | { accessToken?: string },
  status: 'authenticated' as 'authenticated' | 'loading' | 'unauthenticated',
}))

vi.mock('next-auth/react', () => ({
  useSession: () => sessionState,
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

import { useUpdateUserProfile, type UserProfile } from '@/lib/hooks/use-user'

function createWrapper(queryClient: QueryClient) {
  const TestQueryClientWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  TestQueryClientWrapper.displayName = 'TestQueryClientWrapper'

  return TestQueryClientWrapper
}

describe('useUpdateUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionState.data = { accessToken: 'token' }
    sessionState.status = 'authenticated'
  })

  it('refreshes auth and weather caches after saving a location', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const baseProfile: UserProfile = {
      id: 'user-1',
      email: 'ada@example.com',
      display_name: 'Ada',
      timezone: 'UTC',
      role: 'owner',
      onboarding_completed: true,
    }
    const updatedProfile: UserProfile = {
      ...baseProfile,
      timezone: 'Asia/Shanghai',
      location_name: 'Shanghai',
      location_lat: 31.2304,
      location_lon: 121.4737,
    }

    queryClient.setQueryData(['user-profile'], baseProfile)
    queryClient.setQueryData(['auth-user'], baseProfile)
    queryClient.setQueryData(['weather', 'user-1', null, null], { temperature: 18 })
    queryClient.setQueryData(['weather-forecast', 'user-1', null, null, 4], { forecast: [] })

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => updatedProfile,
    } as Response)

    const { result } = renderHook(() => useUpdateUserProfile(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        timezone: 'Asia/Shanghai',
        location_name: 'Shanghai',
        location_lat: 31.2304,
        location_lon: 121.4737,
      })
    })

    expect(queryClient.getQueryState(['user-profile'])?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(['auth-user'])?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(['weather', 'user-1', null, null])?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(['weather-forecast', 'user-1', null, null, 4])?.isInvalidated).toBe(true)
  })
})
