// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  pairing: {
    id: 'pairing-1',
    name: '配对穿搭',
    occasion: 'casual',
    source_item: { type: 'shirt' },
    source: 'pairing',
  },
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

vi.mock('../../components/compact-option-group', () => ({
  CompactOptionGroup: () => <div>filters</div>,
}))

vi.mock('../../components/empty-state', () => ({
  EmptyState: () => <div>empty</div>,
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
  SectionCard: ({ children }: { children?: React.ReactNode }) => <section data-testid='section-card'>{children}</section>,
}))

vi.mock('../../components/ui-theme', () => ({
  colors: { textMuted: '#666', text: '#111' },
  secondaryButtonStyle: {},
  toneSurfaceStyle: (tone: string) => ({
    backgroundColor: tone,
    border: tone,
  }),
}))

vi.mock('../../hooks/use-auth-guard', () => ({
  useAuthGuard: () => true,
}))

vi.mock('../../hooks/use-items', () => ({
  useItemTypes: () => ({ data: [] }),
}))

vi.mock('../../hooks/use-pairings', () => ({
  usePairings: () => ({
    data: {
      pairings: [mocks.pairing],
      total: 1,
      has_more: false,
    },
    isLoading: false,
  }),
}))

vi.mock('../../lib/display', () => ({
  formatItemTypeLabel: (type: string) => type,
  formatOutfitDetailLabel: (outfit: { name?: string | null; occasion?: string | null }) =>
    `查看${outfit.name || outfit.occasion}详情`,
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    tf: () => '1',
  }),
}))

describe('PairingsPage', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps the source filter as a flat control row instead of a standalone card', async () => {
    const { default: PairingsPage } = await import('./index')
    render(<PairingsPage />)

    expect(screen.getByText('filters')).toBeTruthy()
    expect(screen.queryByTestId('section-card')).toBeNull()
  })

  it('opens pairing details when tapping a pairing card', async () => {
    const { default: PairingsPage } = await import('./index')
    render(<PairingsPage />)

    fireEvent.click(screen.getByText('pairing-1'))

    expect(screen.getByText('detail:pairing-1')).toBeTruthy()
  })

  it('labels pairing cards as direct detail actions', async () => {
    const { default: PairingsPage } = await import('./index')
    render(<PairingsPage />)

    const action = screen.getByLabelText('查看配对穿搭详情')
    expect(action.getAttribute('role')).toBe('button')
  })
})
