// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  acceptMutateAsync: vi.fn(),
  acceptPending: false,
  rejectMutateAsync: vi.fn(),
  rejectPending: false,
  suggestPending: false,
  suggestMutateAsync: vi.fn(),
  useWeather: vi.fn(),
  useWeatherForecast: vi.fn(),
  useUserProfile: vi.fn(),
  previewImage: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  Image: ({
    ariaLabel,
    onClick,
    src,
    style,
  }: {
    ariaLabel?: string
    onClick?: React.MouseEventHandler<HTMLImageElement>
    src?: string
    style?: React.CSSProperties
  }) => <img alt={ariaLabel ?? src ?? ''} aria-label={ariaLabel} data-height={style?.height} onClick={onClick} src={src} />,
  Picker: ({
    children,
    end,
    fields,
    mode,
    start,
    value,
  }: {
    children?: React.ReactNode
    end?: string
    fields?: string
    mode?: string
    start?: string
    value?: string
  }) => (
    <div
      data-end={end}
      data-fields={fields}
      data-mode={mode}
      data-start={start}
      data-testid={mode === 'date' && fields !== 'month' ? 'target-date-picker' : undefined}
      data-value={value}
    >
      {children}
    </div>
  ),
  Slider: () => <input aria-label='temperature' type='range' />,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  View: ({
    ariaLabel,
    ariaRole,
    children,
    onClick,
    style,
  }: {
    ariaLabel?: string
    ariaRole?: string
    children?: React.ReactNode
    onClick?: () => void
    style?: React.CSSProperties
  }) => <div aria-label={ariaLabel} role={ariaRole} onClick={onClick} style={style}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    previewImage: mocks.previewImage,
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
  useAcceptOutfit: () => ({ isPending: mocks.acceptPending, mutateAsync: mocks.acceptMutateAsync }),
  useRejectOutfit: () => ({ isPending: mocks.rejectPending, mutateAsync: mocks.rejectMutateAsync }),
  useSuggestOutfit: () => ({ isPending: mocks.suggestPending, mutateAsync: mocks.suggestMutateAsync }),
  useWeather: mocks.useWeather,
  useWeatherForecast: mocks.useWeatherForecast,
}))

vi.mock('../../lib/i18n', async () => {
  const actual = await vi.importActual<typeof import('../../lib/i18n')>('../../lib/i18n')
  return {
    ...actual,
    useI18n: () => ({
      locale: 'zh' as const,
      t: actual.translate,
      tf: actual.formatMessage,
      greeting: actual.formatGreeting,
    }),
  }
})

describe('SuggestPage weather queries', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.acceptPending = false
    mocks.rejectPending = false
    mocks.suggestPending = false
    mocks.suggestMutateAsync.mockResolvedValue({
      id: 'outfit-1',
      occasion: 'casual',
      scheduled_for: '2026-05-03',
      status: 'pending',
      source: 'on_demand',
      name: null,
      replaces_outfit_id: null,
      cloned_from_outfit_id: null,
      reasoning: 'Rain-ready casual',
      style_notes: null,
      highlights: [],
      weather: {
        temperature: 20,
        feels_like: 20,
        humidity: 50,
        precipitation_chance: 80,
        condition: 'rainy',
      },
      items: [],
      feedback: null,
      family_ratings: null,
      family_rating_average: null,
      family_rating_count: null,
      created_at: '2026-05-03T00:00:00Z',
    })
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

  it('clears the weather override controls when starting a new request', async () => {
    mocks.useUserProfile.mockReturnValue({ data: null, isLoading: false })

    const { default: SuggestPage } = await import('./index')
    render(<SuggestPage />)

    fireEvent.click(screen.getByText('休闲'))
    fireEvent.click(screen.getByText('展开'))
    fireEvent.click(screen.getByText('雨'))
    expect(screen.getByText('温度：20°C')).toBeTruthy()

    fireEvent.click(screen.getByText('生成推荐'))

    expect(await screen.findByText('重新开始')).toBeTruthy()
    expect(mocks.suggestMutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      weather_override: expect.objectContaining({ condition: 'rainy' }),
    }))

    fireEvent.click(screen.getByText('重新开始'))

    await waitFor(() => {
      expect(screen.getByText('展开')).toBeTruthy()
      expect(screen.queryByText('温度：20°C')).toBeNull()
    })
  })

  it('does not render duplicate marketing-style hero copy above the request controls', async () => {
    mocks.useUserProfile.mockReturnValue({ data: null, isLoading: false })

    const { default: SuggestPage } = await import('./index')
    render(<SuggestPage />)

    expect(screen.queryByText('STYLE STUDIO')).toBeNull()
    expect(screen.queryByText('按天气和场景生成穿搭')).toBeNull()
  })

  it('does not submit a disabled recommendation request', async () => {
    mocks.useUserProfile.mockReturnValue({ data: null, isLoading: false })

    const { default: SuggestPage } = await import('./index')
    render(<SuggestPage />)

    fireEvent.click(screen.getByText('生成推荐').parentElement!)

    expect(mocks.suggestMutateAsync).not.toHaveBeenCalled()
  })

  it('does not submit again while a recommendation is already generating', async () => {
    mocks.suggestPending = true
    mocks.useUserProfile.mockReturnValue({ data: null, isLoading: false })

    const { default: SuggestPage } = await import('./index')
    render(<SuggestPage />)

    fireEvent.click(screen.getByText('休闲'))
    fireEvent.click(screen.getByText('生成中...').parentElement!)

    expect(mocks.suggestMutateAsync).not.toHaveBeenCalled()
  })

  it('limits target date selection to the forecast window accepted by the backend', async () => {
    mocks.useUserProfile.mockReturnValue({ data: null, isLoading: false })
    const today = new Date()
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + 15)
    const formatDate = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    const { default: SuggestPage } = await import('./index')
    render(<SuggestPage />)

    const picker = screen.getByTestId('target-date-picker')
    expect(picker.getAttribute('data-start')).toBe(formatDate(today))
    expect(picker.getAttribute('data-end')).toBe(formatDate(maxDate))
  })

  it('keeps weather override toggles large enough for touch', async () => {
    mocks.useUserProfile.mockReturnValue({ data: null, isLoading: false })

    const { default: SuggestPage } = await import('./index')
    render(<SuggestPage />)

    const weatherOverrideToggle = screen.getByLabelText('天气覆盖')
    expect(weatherOverrideToggle.getAttribute('role')).toBe('button')
    expect(weatherOverrideToggle.style.minHeight).toBe('44px')
  })

  it('renders generated outfit items as an image-first preview grid', async () => {
    mocks.useUserProfile.mockReturnValue({ data: null, isLoading: false })
    mocks.suggestMutateAsync.mockResolvedValueOnce({
      id: 'outfit-1',
      occasion: 'casual',
      scheduled_for: '2026-05-03',
      status: 'pending',
      source: 'on_demand',
      name: null,
      replaces_outfit_id: null,
      cloned_from_outfit_id: null,
      reasoning: 'Rain-ready casual',
      style_notes: null,
      highlights: [],
      weather: null,
      items: [
        {
          id: 'item-1',
          name: 'Blue Jacket',
          type: 'jacket',
          layer_type: 'outer',
          image_url: 'original-jacket.jpg',
          medium_url: 'medium-jacket.jpg',
          thumbnail_url: 'thumb-jacket.jpg',
        },
        {
          id: 'item-2',
          name: 'White Shirt',
          type: 'shirt',
          layer_type: 'top',
          image_url: 'original-shirt.jpg',
          medium_url: 'medium-shirt.jpg',
          thumbnail_url: 'thumb-shirt.jpg',
        },
      ],
      feedback: null,
      family_ratings: null,
      family_rating_average: null,
      family_rating_count: null,
      created_at: '2026-05-03T00:00:00Z',
    })

    const { default: SuggestPage } = await import('./index')
    const { container } = render(<SuggestPage />)

    fireEvent.click(screen.getByText('休闲'))
    fireEvent.click(screen.getByText('生成推荐'))

    const image = container.querySelector('img')
    const imageSurface = await screen.findByLabelText('查看 Blue Jacket 大图')
    expect(image).toBeNull()
    expect(imageSurface.tagName).toBe('DIV')
    expect(imageSurface.getAttribute('style')).toContain('height: 172px')
    expect(imageSurface.getAttribute('style')).toContain('thumb-jacket.jpg')

    fireEvent.click(imageSurface)

    expect(mocks.previewImage).toHaveBeenCalledWith({
      current: 'original-jacket.jpg',
      urls: ['original-jacket.jpg', 'original-shirt.jpg'],
    })
  })

  it('does not submit generated outfit result actions while they are pending', async () => {
    mocks.acceptPending = true
    mocks.rejectPending = true
    mocks.useUserProfile.mockReturnValue({ data: null, isLoading: false })

    const { default: SuggestPage } = await import('./index')
    render(<SuggestPage />)

    fireEvent.click(screen.getByText('休闲'))
    fireEvent.click(screen.getByText('生成推荐'))

    const acceptButton = (await screen.findByText('就穿它')).parentElement!
    const rejectButton = screen.getByText('拒绝').parentElement!

    expect(acceptButton.style.opacity).toBe('0.7')
    expect(rejectButton.style.opacity).toBe('0.7')

    fireEvent.click(acceptButton)
    fireEvent.click(rejectButton)

    expect(mocks.acceptMutateAsync).not.toHaveBeenCalled()
    expect(mocks.rejectMutateAsync).not.toHaveBeenCalled()
  })
})
