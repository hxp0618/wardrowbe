// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  family: {
    members: [{ id: 'member-1', display_name: 'Ada', email: 'ada@example.com', role: 'member' }],
  } as
    | {
        members: Array<{ id: string; display_name: string; email: string; role: string }>
      }
    | undefined,
  outfit: { id: 'family-outfit-1', name: '家庭穿搭', occasion: 'casual' },
  navigateTo: vi.fn(),
  pageScrollTo: vi.fn(),
  redirectTo: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  View: ({
    ariaLabel,
    ariaRole,
    children,
    onClick,
  }: {
    ariaLabel?: string
    ariaRole?: string
    children?: React.ReactNode
    onClick?: () => void
  }) => <div aria-label={ariaLabel} role={ariaRole} onClick={onClick}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    navigateTo: mocks.navigateTo,
    pageScrollTo: mocks.pageScrollTo,
    redirectTo: mocks.redirectTo,
    switchTab: vi.fn(),
  },
}))

vi.mock('../../components/compact-option-group', () => ({
  CompactOptionGroup: () => <div>members</div>,
}))

vi.mock('../../components/empty-state', () => ({
  EmptyState: ({ action }: { action?: React.ReactNode }) => (
    <div>
      empty
      {action}
    </div>
  ),
}))

vi.mock('../../components/outfit-card', () => ({
  OutfitCard: ({ outfit }: { outfit: { id: string } }) => <article>{outfit.id}</article>,
}))

vi.mock('../../components/outfit-detail-sheet', () => ({
  OutfitDetailSheet: ({ outfit, visible }: { outfit: { id: string } | null; visible: boolean }) =>
    visible && outfit ? <aside>detail:{outfit.id}</aside> : null,
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: ({ children }: { children?: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('../../components/section-card', () => ({
  SectionCard: ({ children, title }: { children?: React.ReactNode; title: string }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}))

vi.mock('../../components/flat-data', () => ({
  FlatMetricGrid: ({
    metrics,
  }: {
    metrics: Array<{ label: string; onClick?: () => void; value: string }>
  }) => (
    <div data-testid='flat-metrics'>
      {metrics.map((metric) => (
        <button key={metric.label} onClick={metric.onClick}>
          {metric.label}:{metric.value}
        </button>
      ))}
    </div>
  ),
  FlatSection: ({ children, title }: { children?: React.ReactNode; title: string }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}))

vi.mock('../../components/stat-card', () => ({
  StatCard: ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <div data-testid='stat-card' onClick={onClick}>{label}</div>
  ),
}))

vi.mock('../../components/ui-badge', () => ({
  UIBadge: () => <span>role</span>,
}))

vi.mock('../../components/ui-theme', () => ({
  colors: { text: '#111', textMuted: '#666', textSoft: '#999' },
  secondaryButtonStyle: {},
  toneSurfaceStyle: (tone: string) => ({
    backgroundColor: tone,
    border: tone,
  }),
}))

vi.mock('../../hooks/use-auth-guard', () => ({
  useAuthGuard: () => true,
}))

vi.mock('../../hooks/use-family', () => ({
  useFamily: () => ({
    data: mocks.family,
  }),
}))

vi.mock('../../hooks/use-outfits', () => ({
  useFamilyOutfits: () => ({
    data: {
      outfits: [mocks.outfit],
      total: 1,
    },
    isLoading: false,
  }),
}))

vi.mock('../../lib/display', () => ({
  formatOutfitDetailLabel: (outfit: { name?: string | null; occasion?: string | null }) =>
    `查看${outfit.name || outfit.occasion}详情`,
  formatRoleLabel: (role: string) => role,
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    tf: () => '1',
  }),
}))

describe('FamilyFeedPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.family = {
      members: [{ id: 'member-1', display_name: 'Ada', email: 'ada@example.com', role: 'member' }],
    }
  })

  it('opens family outfit details when tapping an outfit card', async () => {
    const { default: FamilyFeedPage } = await import('./index')
    render(<FamilyFeedPage />)

    fireEvent.click(screen.getByText('family-outfit-1'))

    expect(screen.getByText('detail:family-outfit-1')).toBeTruthy()
    expect(screen.getByLabelText('查看家庭穿搭详情').getAttribute('role')).toBe('button')
  })

  it('scrolls summary stats to the member picker and outfit feed', async () => {
    const { default: FamilyFeedPage } = await import('./index')
    render(<FamilyFeedPage />)

    expect(screen.getByTestId('flat-metrics')).toBeTruthy()
    expect(screen.queryByTestId('stat-card')).toBeNull()

    fireEvent.click(screen.getByText('family_feed_stat_members_label:1'))

    expect(mocks.pageScrollTo).toHaveBeenCalledWith({
      selector: '#family-feed-members',
      duration: 240,
    })

    fireEvent.click(screen.getByText('family_feed_stat_outfits_label:1'))

    expect(mocks.pageScrollTo).toHaveBeenLastCalledWith({
      selector: '#family-feed-outfits',
      duration: 240,
    })
  })

  it('keeps the selected member summary inside the picker section', async () => {
    const { default: FamilyFeedPage } = await import('./index')
    render(<FamilyFeedPage />)

    expect(screen.getByText('Ada')).toBeTruthy()
    expect(screen.getByText('ada@example.com')).toBeTruthy()
    expect(screen.queryByText('family_feed_member_summary_title')).toBeNull()
  })

  it('falls back to redirecting to family management when page navigation times out', async () => {
    mocks.family = undefined
    mocks.navigateTo.mockRejectedValueOnce(new Error('navigateTo:fail timeout'))
    const { default: FamilyFeedPage } = await import('./index')
    render(<FamilyFeedPage />)

    fireEvent.click(screen.getByText('family_feed_go_family'))

    await waitFor(() => {
      expect(mocks.redirectTo).toHaveBeenCalledWith({
        url: '/pages/family/index',
      })
    })
  })
})
