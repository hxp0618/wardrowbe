// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { OutfitFilters } from '../../services/types'

const mocks = vi.hoisted(() => ({
  useOutfits: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
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
    switchTab: vi.fn(),
  },
}))

vi.mock('../../components/empty-state', () => ({
  EmptyState: ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  ),
}))

vi.mock('../../components/outfit-card', () => ({
  OutfitCard: () => <article>outfit-card</article>,
}))

vi.mock('../../components/outfit-detail-sheet', () => ({
  OutfitDetailSheet: () => null,
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

vi.mock('../../hooks/use-outfits', () => ({
  useOutfits: mocks.useOutfits,
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => ({
      outfits_chip_all: '全部',
      outfits_chip_pending: '待确认',
      outfits_chip_my_looks: '我的穿搭',
      outfits_chip_worn: '已穿',
      outfits_chip_pairings: '搭配',
      outfits_chip_ai: 'AI 推荐',
      outfits_empty_title: '还没有穿搭',
      outfits_empty_description_default: '当有更多穿搭记录后，这里会显示',
      outfits_empty_description_my_looks: '去推荐页创建你的第一套穿搭',
      outfits_get_suggestion: '去获取推荐',
      outfits_loading_title: '加载中',
      outfits_loading: '加载中...',
      outfits_load_more: '加载更多',
    }[key] ?? key),
    tf: (_key: string, values: { count: number }) => `共 ${values.count} 套`,
  }),
}))

describe('OutfitsPage filters', () => {
  afterEach(() => {
    cleanup()
  })

  it('requests pending outfits when the Pending chip is selected', async () => {
    mocks.useOutfits.mockReturnValue({
      data: {
        outfits: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_more: false,
      },
      isLoading: false,
    })

    const { default: OutfitsPage } = await import('./index')
    render(<OutfitsPage />)

    fireEvent.click(screen.getByText('待确认'))

    await waitFor(() => {
      expect(mocks.useOutfits).toHaveBeenLastCalledWith(
        { status: 'pending' } satisfies OutfitFilters,
        1,
        20
      )
    })
  })

  it('requests pairing outfits by source when the Pairings chip is selected', async () => {
    mocks.useOutfits.mockReturnValue({
      data: {
        outfits: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_more: false,
      },
      isLoading: false,
    })

    const { default: OutfitsPage } = await import('./index')
    render(<OutfitsPage />)

    fireEvent.click(screen.getByText('搭配'))

    await waitFor(() => {
      expect(mocks.useOutfits).toHaveBeenLastCalledWith(
        { source: 'pairing' } satisfies OutfitFilters,
        1,
        20
      )
    })
  })

  it('labels outfit cards as direct detail actions', async () => {
    mocks.useOutfits.mockReturnValue({
      data: {
        outfits: [
          {
            id: 'outfit-1',
            name: '周末穿搭',
            occasion: 'casual',
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
        has_more: false,
      },
      isLoading: false,
    })

    const { default: OutfitsPage } = await import('./index')
    render(<OutfitsPage />)

    const action = screen.getByLabelText('查看周末穿搭详情')
    expect(action.getAttribute('role')).toBe('button')
  })
})
