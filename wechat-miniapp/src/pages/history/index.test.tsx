// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Outfit } from '../../services/types'

const mocks = vi.hoisted(() => ({
  useAuthGuard: vi.fn(),
  useCalendarOutfits: vi.fn(),
  routeParams: {} as Record<string, string>,
}))

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function makeOutfit(): Outfit {
  return {
    id: 'outfit-history-1',
    occasion: 'office',
    scheduled_for: today(),
    status: 'accepted',
    source: 'manual',
    name: 'History Office Look',
    replaces_outfit_id: null,
    cloned_from_outfit_id: null,
    reasoning: null,
    style_notes: null,
    highlights: null,
    weather: null,
    feedback: null,
    family_ratings: null,
    family_rating_average: null,
    family_rating_count: null,
    is_starter_suggestion: false,
    created_at: `${today()}T00:00:00Z`,
    items: [],
  } as Outfit
}

vi.mock('@tarojs/components', () => ({
  Picker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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
    getCurrentInstance: () => ({ router: { params: mocks.routeParams } }),
    switchTab: vi.fn(),
  },
}))

vi.mock('../../components/empty-state', () => ({
  EmptyState: ({
    action,
    description,
    title,
  }: {
    action?: React.ReactNode
    description: string
    title: string
  }) => (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  ),
}))

vi.mock('../../components/outfit-card', () => ({
  OutfitCard: ({ outfit }: { outfit: Outfit }) => <article>{outfit.name}</article>,
}))

vi.mock('../../components/outfit-detail-sheet', () => ({
  OutfitDetailSheet: ({
    outfit,
    visible,
  }: {
    outfit: Outfit | null
    visible: boolean
  }) => (visible && outfit ? <aside>detail:{outfit.name}</aside> : null),
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
  SectionCard: ({
    children,
    extra,
    title,
  }: {
    children?: React.ReactNode
    extra?: React.ReactNode
    title: string
  }) => (
    <section data-testid='history-section-card'>
      <h2>{title}</h2>
      {extra}
      {children}
    </section>
  ),
}))

vi.mock('../../components/ui-theme', () => ({
  colors: {
    border: '#ddd',
    borderStrong: '#333',
    surfaceMuted: '#f7f7f7',
    surfaceSelected: '#eee',
    text: '#111',
    textMuted: '#666',
  },
  inputStyle: {},
  secondaryButtonStyle: {},
  toneSurfaceStyle: (tone: string) => ({
    backgroundColor: tone,
    border: tone,
  }),
}))

vi.mock('../../hooks/use-auth-guard', () => ({
  useAuthGuard: mocks.useAuthGuard,
}))

vi.mock('../../hooks/use-outfits', () => ({
  useCalendarOutfits: mocks.useCalendarOutfits,
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    tf: (key: string, values?: Record<string, string | number>) =>
      key === 'history_month_label' ? `月份：${values?.value}` : key,
  }),
}))

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.routeParams = {}
    mocks.useAuthGuard.mockReturnValue(true)
    mocks.useCalendarOutfits.mockReturnValue({
      data: {
        outfits: [makeOutfit()],
      },
      isLoading: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('opens outfit details when tapping a history record', async () => {
    const { default: HistoryPage } = await import('./index')

    render(<HistoryPage />)

    fireEvent.click(screen.getByText('History Office Look'))

    expect(screen.getByText('detail:History Office Look')).toBeTruthy()
    expect(screen.getByLabelText('查看History Office Look详情').getAttribute('role')).toBe('button')
  })

  it('filters history from compact option chips', async () => {
    const { default: HistoryPage } = await import('./index')

    render(<HistoryPage />)

    fireEvent.click(screen.getByText('办公'))

    expect(mocks.useCalendarOutfits).toHaveBeenLastCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ occasion: 'office' })
    )
  })

  it('keeps history filters and available dates in one flat control section', async () => {
    const { default: HistoryPage } = await import('./index')

    render(<HistoryPage />)

    expect(screen.queryByTestId('history-section-card')).toBeNull()
    expect(screen.getByText('history_filters_title')).toBeTruthy()
    expect(screen.getByText('history_dates_title')).toBeTruthy()
    expect(screen.getAllByText(today()).length).toBeGreaterThan(0)
  })

  it('renders available dates as accessible finger-sized controls', async () => {
    const { default: HistoryPage } = await import('./index')

    render(<HistoryPage />)

    const dateButton = screen.getByLabelText(`查看 ${today()} 记录`)
    expect(dateButton.getAttribute('role')).toBe('button')
    expect(dateButton.style.minHeight).toBe('44px')
  })

  it('does not show the return-to-today action while already viewing today', async () => {
    const { default: HistoryPage } = await import('./index')

    render(<HistoryPage />)

    expect(screen.queryByText('history_back_today')).toBeNull()
  })

  it('applies pending status when opened from a pending route link', async () => {
    mocks.routeParams = { status: 'pending' }
    const { default: HistoryPage } = await import('./index')

    render(<HistoryPage />)

    expect(mocks.useCalendarOutfits).toHaveBeenLastCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ status: 'pending' })
    )
  })

  it('keeps hook order stable when auth rendering becomes available', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.useAuthGuard.mockReturnValueOnce(false).mockReturnValue(true)
    const { default: HistoryPage } = await import('./index')

    const { rerender } = render(<HistoryPage />)
    rerender(<HistoryPage />)

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('React has detected a change in the order of Hooks')
    )
    consoleError.mockRestore()
  })
})
