// @vitest-environment jsdom

import React from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  useWeather: vi.fn(),
  useWeatherForecast: vi.fn(),
  useUserProfile: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  Image: ({ src }: { src?: string }) => <img alt='' src={src} />,
  Picker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Slider: () => <input aria-label='temperature' type='range' />,
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
    showToast: vi.fn(),
  },
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: ({ children }: { children?: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('../../components/section-card', () => ({
  SectionCard: ({ children }: { children?: React.ReactNode }) => <section>{children}</section>,
}))

vi.mock('../../hooks/use-auth-guard', () => ({
  useAuthGuard: () => true,
}))

vi.mock('../../hooks/use-preferences', () => ({
  usePreferences: () => ({ data: { temperature_unit: 'celsius' } }),
}))

vi.mock('../../hooks/use-user', () => ({
  useUserProfile: mocks.useUserProfile,
}))

vi.mock('../../hooks/use-outfits', () => ({
  useAcceptOutfit: () => ({ mutateAsync: vi.fn() }),
  useRejectOutfit: () => ({ mutateAsync: vi.fn() }),
  useSuggestOutfit: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useWeather: mocks.useWeather,
  useWeatherForecast: mocks.useWeatherForecast,
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('SuggestPage weather queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useWeather.mockReturnValue({ data: null, isLoading: false })
    mocks.useWeatherForecast.mockReturnValue({ data: null, isLoading: false })
  })

  it('uses saved profile coordinates for current and forecast weather', async () => {
    const profile = {
      id: 'user-1',
      email: 'ada@example.com',
      display_name: 'Ada',
      timezone: 'Asia/Shanghai',
      location_lat: 31.2304,
      location_lon: 121.4737,
      location_name: 'Shanghai',
      role: 'owner',
      onboarding_completed: true,
    }
    mocks.useUserProfile.mockReturnValue({ data: profile, isLoading: false })

    const { default: SuggestPage } = await import('./index')
    render(<SuggestPage />)

    expect(mocks.useWeather).toHaveBeenCalledWith(profile, true)
    expect(mocks.useWeatherForecast).toHaveBeenCalledWith(0, false, profile)
  })
})
