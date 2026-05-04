// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  previewImage: vi.fn(),
  useAnalytics: vi.fn(),
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
  }) => <img alt={ariaLabel ?? ''} aria-label={ariaLabel} data-height={style?.height} data-radius={style?.borderRadius} onClick={onClick} src={src} />,
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
  },
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: ({ children, title }: { children?: React.ReactNode; title: string }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}))

vi.mock('../../components/section-card', () => ({
  SectionCard: ({ children, title }: { children?: React.ReactNode; title: string }) => (
    <section data-testid={`section-card-${title}`}>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}))

vi.mock('../../hooks/use-auth-guard', () => ({
  useAuthGuard: () => true,
}))

vi.mock('../../hooks/use-analytics', () => ({
  useAnalytics: mocks.useAnalytics,
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    tf: (key: string, values?: Record<string, string | number>) =>
      values ? `${key} ${Object.values(values).join(' ')}` : key,
  }),
}))

function makeAnalyticsData() {
  const wearItem = {
    id: 'item-1',
    name: 'Black jacket',
    type: 'outerwear',
    primary_color: 'black',
    thumbnail_path: '/thumb.jpg',
    thumbnail_url: 'https://cdn.test/jacket-thumb.jpg',
    medium_url: 'https://cdn.test/jacket-medium.jpg',
    image_url: 'https://cdn.test/jacket-full.jpg',
    wear_count: 8,
    last_worn_at: null,
  }

  return {
    acceptance_trend: [],
    color_distribution: [
      { color: 'black', count: 6, percentage: 60 },
      { color: 'blue', count: 4, percentage: 40 },
    ],
    insights: [],
    least_worn: [],
    most_worn: [wearItem],
    never_worn: [],
    type_distribution: [
      { type: 'outerwear', count: 5, percentage: 50 },
      { type: 'shirt', count: 3, percentage: 30 },
    ],
    wardrobe: {
      acceptance_rate: null,
      average_rating: null,
      items_by_status: {},
      outfits_this_month: 0,
      outfits_this_week: 0,
      total_items: 1,
      total_outfits: 0,
      total_wears: 8,
    },
  }
}

describe('AnalyticsPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useAnalytics.mockReturnValue({
      data: makeAnalyticsData(),
      isLoading: false,
    })
  })

  it('shows item images in wear stat lists and previews the original image', async () => {
    const { default: AnalyticsPage } = await import('./index')

    const { container } = render(<AnalyticsPage />)

    const image = container.querySelector('img')
    const imageSurface = container.querySelector('[aria-label="查看 Black jacket 大图"]') as HTMLElement | null
    expect(image).toBeNull()
    expect(imageSurface).not.toBeNull()
    expect(imageSurface?.tagName).toBe('DIV')
    expect(imageSurface?.style.backgroundImage).toContain('https://cdn.test/jacket-thumb.jpg')
    expect(imageSurface?.style.height).toBe('64px')
    expect(imageSurface?.style.borderRadius).toBe('8px')

    fireEvent.click(imageSurface!)

    expect(mocks.previewImage).toHaveBeenCalledWith({
      current: 'https://cdn.test/jacket-full.jpg',
      urls: ['https://cdn.test/jacket-full.jpg'],
    })
  })

  it('renders visual distribution and acceptance trend charts', async () => {
    mocks.useAnalytics.mockReturnValue({
      data: {
        ...makeAnalyticsData(),
        acceptance_trend: [
          { period: 'W1', total: 4, accepted: 3, rejected: 1, rate: 75 },
          { period: 'W2', total: 2, accepted: 1, rejected: 1, rate: 50 },
        ],
      },
      isLoading: false,
    })
    const { default: AnalyticsPage } = await import('./index')

    const { container } = render(<AnalyticsPage />)

    expect(container.querySelector('[aria-label="analytics-color-bar-black"]')).not.toBeNull()
    expect(container.querySelector('[aria-label="analytics-type-bar-outerwear"]')).not.toBeNull()
    expect(container.querySelector('[aria-label="analytics-trend-bar-W1"]')).not.toBeNull()
  })

  it('keeps the range selector as a flat control row rather than a standalone card', async () => {
    const { default: AnalyticsPage } = await import('./index')

    render(<AnalyticsPage />)

    expect(screen.getByText('analytics_range_title')).toBeTruthy()
    expect(screen.queryByTestId('section-card-analytics_range_title')).toBeNull()
  })
})
