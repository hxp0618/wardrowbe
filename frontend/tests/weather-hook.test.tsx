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

import { useWeather, useWeatherForecast } from '@/lib/hooks/use-weather'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const TestQueryClientWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  TestQueryClientWrapper.displayName = 'TestQueryClientWrapper'

  return TestQueryClientWrapper
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

describe('useWeatherForecast', () => {
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

  it('does not fetch forecast before the user has a saved location', async () => {
    renderHook(() => useWeatherForecast(4), {
      wrapper: createWrapper(),
    })

    await new Promise((resolve) => setTimeout(resolve, 25))

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('fetches forecast once coordinates are available', async () => {
    authState.user = {
      id: 'user-1',
      location_lat: 31.2304,
      location_lon: 121.4737,
    }

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        latitude: 31.2304,
        longitude: 121.4737,
        forecast: [
          {
            date: '2026-04-20',
            temp_min: 18,
            temp_max: 26,
            precipitation_chance: 20,
            condition: 'cloudy',
            condition_code: 3,
          },
        ],
      }),
    } as Response)

    const { result } = renderHook(() => useWeatherForecast(4), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(result.current.data?.forecast[0].date).toBe('2026-04-20')
    })
  })
})
