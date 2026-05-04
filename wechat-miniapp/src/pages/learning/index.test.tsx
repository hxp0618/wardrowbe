// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  acknowledge: vi.fn(),
  generate: vi.fn(),
  previewImage: vi.fn(),
  recompute: vi.fn(),
  useLearning: vi.fn(),
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
  }) => <div aria-label={ariaLabel} role={ariaRole} style={style} onClick={onClick}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    previewImage: mocks.previewImage,
    showToast: vi.fn(),
  },
}))

vi.mock('../../components/empty-state', () => ({
  EmptyState: ({ description, title }: { description?: string; title: string }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: ({
    actions,
    children,
    subtitle,
    title,
  }: {
    actions?: React.ReactNode
    children?: React.ReactNode
    subtitle?: string
    title: string
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div>{actions}</div>
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

vi.mock('../../components/stat-card', () => ({
  StatCard: ({ label, value }: { label: string; value: string }) => (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  ),
}))

vi.mock('../../components/ui-theme', () => ({
  colors: {
    accent: '#111',
    accentText: '#fff',
    border: '#ddd',
    danger: '#d00',
    infoText: '#06c',
    success: '#080',
    surfaceMuted: '#f5f5f5',
    surfaceSelected: '#eee',
    text: '#111',
    textMuted: '#666',
    textSoft: '#999',
    warning: '#c80',
  },
  primaryButtonStyle: {},
  secondaryButtonStyle: {},
  toneSurfaceStyle: (tone: string) => ({
    backgroundColor: tone,
    border: tone,
  }),
}))

vi.mock('../../hooks/use-auth-guard', () => ({
  useAuthGuard: () => true,
}))

vi.mock('../../hooks/use-learning', () => ({
  useAcknowledgeInsight: () => ({ isPending: false, mutateAsync: mocks.acknowledge }),
  useGenerateInsights: () => ({ isPending: false, mutateAsync: mocks.generate }),
  useLearning: mocks.useLearning,
  useRecomputeLearning: () => ({ isPending: false, mutateAsync: mocks.recompute }),
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    tf: (key: string, values?: Record<string, string | number>) =>
      values ? `${key} ${Object.values(values).join(' ')}` : key,
  }),
}))

describe('LearningPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useLearning.mockReturnValue({
      data: {
        best_pairs: [],
        insights: [],
        preference_suggestions: {
          updated: false,
        },
        profile: {
          average_comfort_rating: null,
          average_rating: null,
          average_style_rating: null,
          color_preferences: [],
          feedback_count: 3,
          has_learning_data: true,
          last_computed_at: null,
          occasion_patterns: [],
          outfits_rated: 3,
          overall_acceptance_rate: 0.667,
          style_preferences: [],
          weather_preferences: [
            {
              preferred_layers: 2,
              success_rate: 0.75,
              weather_type: 'mild',
            },
          ],
        },
      },
      isLoading: false,
    })
  })

  it('renders fractional acceptance rate as a percentage', async () => {
    const { default: LearningPage } = await import('./index')

    render(<LearningPage />)

    expect(screen.getByText('66.7%')).toBeTruthy()
  })

  it('keeps header actions large enough for touch', async () => {
    const { default: LearningPage } = await import('./index')

    render(<LearningPage />)

    expect(screen.getByText('learning_action_recompute').parentElement?.style.minHeight).toBe('44px')
    expect(screen.getByText('learning_action_generate').parentElement?.style.minHeight).toBe('44px')
  })

  it('localizes weather preference labels', async () => {
    const { default: LearningPage } = await import('./index')

    render(<LearningPage />)

    expect(screen.getByText('温和')).toBeTruthy()
  })

  it('renders profile preference data as visual bars', async () => {
    mocks.useLearning.mockReturnValue({
      data: {
        best_pairs: [],
        insights: [],
        preference_suggestions: {
          updated: false,
        },
        profile: {
          average_comfort_rating: null,
          average_rating: null,
          average_style_rating: null,
          color_preferences: [
            {
              color: 'blue',
              interpretation: '偏好',
              score: 0.72,
            },
          ],
          feedback_count: 3,
          has_learning_data: true,
          last_computed_at: null,
          occasion_patterns: [
            {
              occasion: 'work',
              preferred_colors: ['blue'],
              success_rate: 0.8,
            },
          ],
          outfits_rated: 3,
          overall_acceptance_rate: 0.667,
          style_preferences: [
            {
              score: 0.61,
              style: 'classic',
            },
          ],
          weather_preferences: [
            {
              preferred_layers: 2,
              success_rate: 0.75,
              weather_type: 'mild',
            },
          ],
        },
      },
      isLoading: false,
    })
    const { default: LearningPage } = await import('./index')

    const { container } = render(<LearningPage />)

    expect(container.querySelector('[aria-label="learning-color-bar-blue"]')).not.toBeNull()
    expect(container.querySelector('[aria-label="learning-style-bar-classic"]')).not.toBeNull()
    expect(container.querySelector('[aria-label="learning-occasion-bar-work"]')).not.toBeNull()
    expect(container.querySelector('[aria-label="learning-weather-bar-mild"]')).not.toBeNull()
  })

  it('shows best pair item images and previews them', async () => {
    mocks.useLearning.mockReturnValue({
      data: {
        best_pairs: [
          {
            compatibility_score: 0.82,
            item1: {
              id: 'item-1',
              type: 'shirt',
              name: 'White shirt',
              primary_color: 'white',
              thumbnail_path: '/shirt-thumb.jpg',
              thumbnail_url: 'https://cdn.test/shirt-thumb.jpg',
              image_url: 'https://cdn.test/shirt-full.jpg',
            },
            item2: {
              id: 'item-2',
              type: 'pants',
              name: 'Black pants',
              primary_color: 'black',
              thumbnail_path: '/pants-thumb.jpg',
              thumbnail_url: 'https://cdn.test/pants-thumb.jpg',
              image_url: 'https://cdn.test/pants-full.jpg',
            },
            times_accepted: 3,
            times_paired: 4,
          },
        ],
        insights: [],
        preference_suggestions: {
          updated: false,
        },
        profile: {
          average_comfort_rating: null,
          average_rating: null,
          average_style_rating: null,
          color_preferences: [],
          feedback_count: 3,
          has_learning_data: true,
          last_computed_at: null,
          occasion_patterns: [],
          outfits_rated: 3,
          overall_acceptance_rate: 0.667,
          style_preferences: [],
          weather_preferences: [],
        },
      },
      isLoading: false,
    })
    const { default: LearningPage } = await import('./index')

    const { container } = render(<LearningPage />)

    const image = container.querySelector('img')
    const imageSurface = container.querySelector('[aria-label="查看 White shirt 大图"]') as HTMLElement | null
    expect(image).toBeNull()
    expect(imageSurface).not.toBeNull()
    expect(imageSurface?.tagName).toBe('DIV')
    expect(imageSurface?.style.backgroundImage).toContain('https://cdn.test/shirt-thumb.jpg')
    expect(imageSurface?.style.height).toBe('76px')
    expect(imageSurface?.style.borderRadius).toBe('8px')

    fireEvent.click(imageSurface!)

    expect(mocks.previewImage).toHaveBeenCalledWith({
      current: 'https://cdn.test/shirt-full.jpg',
      urls: ['https://cdn.test/shirt-full.jpg', 'https://cdn.test/pants-full.jpg'],
    })
  })
})
