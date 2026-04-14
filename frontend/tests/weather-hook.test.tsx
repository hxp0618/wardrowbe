import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const sessionState = vi.hoisted(() => ({
  data: { accessToken: 'token' } as null | { accessToken?: string },
  status: 'authenticated' as 'authenticated' | 'loading' | 'unauthenticated',
}))

const authState = vi.hoisted(() => ({
  user: null as null | { id: string; location_lat?: number; location_lon?: number },
  isAuthenticated: true,
  isLoading: false,
  error: null as unknown,
  session: { accessToken: 'token' } as null | { accessToken?: string },
}))

vi.mock('next-auth/react', () => ({
  useSession: () => sessionState,
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => authState,
}))

import { useWeather } from '@/lib/hooks/use-weather'

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

describe('useWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionState.data = { accessToken: 'token' }
    sessionState.status = 'authenticated'
    authState.user = null
    authState.isAuthenticated = true
    authState.isLoading = false
    authState.error = null
    authState.session = { accessToken: 'token' }
  })

  it('does not fetch weather before the user has a saved location', async () => {
    renderHook(() => useWeather(), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 25))

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('fetches weather once coordinates are available', async () => {
    authState.user = {
      id: 'user-1',
      location_lat: 31.2304,
      location_lon: 121.4737,
    }

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        temperature: 22,
        feels_like: 21,
        humidity: 50,
        precipitation_chance: 10,
        precipitation_mm: 0,
        wind_speed: 12,
        condition: 'Clear',
        condition_code: 0,
        is_day: true,
        uv_index: 4,
        timestamp: '2026-04-14T12:00:00Z',
      }),
    } as Response)

    const { result } = renderHook(() => useWeather(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(result.current.data?.temperature).toBe(22)
    })
  })
})
