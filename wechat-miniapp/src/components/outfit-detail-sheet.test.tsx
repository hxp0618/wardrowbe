// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Outfit } from '../services/types'

const mocks = vi.hoisted(() => ({
  acceptMutateAsync: vi.fn(),
  acceptPending: false,
  rejectMutateAsync: vi.fn(),
  rejectPending: false,
  deleteMutateAsync: vi.fn(),
  deletePending: false,
  feedbackMutateAsync: vi.fn(),
  feedbackPending: false,
  hideTabBar: vi.fn(() => Promise.resolve()),
  previewImage: vi.fn(),
  showTabBar: vi.fn(() => Promise.resolve()),
  showToast: vi.fn(),
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
  }) => <img alt={ariaLabel ?? ''} aria-label={ariaLabel} data-height={style?.height} onClick={onClick} src={src} />,
  ScrollView: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='native-scroll-view'>{children}</div>
  ),
  Slider: () => <input aria-label='rating' type='range' />,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Textarea: () => <textarea />,
  View: ({
    ariaLabel,
    ariaRole,
    catchMove,
    children,
    onClick,
    style,
  }: {
    ariaLabel?: string
    ariaRole?: string
    catchMove?: boolean
    children?: React.ReactNode
    onClick?: () => void
    style?: React.CSSProperties
  }) => <div aria-label={ariaLabel} data-catch-move={catchMove == null ? undefined : String(catchMove)} role={ariaRole} onClick={onClick} style={style}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    hideTabBar: mocks.hideTabBar,
    previewImage: mocks.previewImage,
    showTabBar: mocks.showTabBar,
    showToast: mocks.showToast,
  },
}))

vi.mock('../hooks/use-outfits', () => ({
  useAcceptOutfit: () => ({ isPending: mocks.acceptPending, mutateAsync: mocks.acceptMutateAsync }),
  useDeleteOutfit: () => ({ isPending: mocks.deletePending, mutateAsync: mocks.deleteMutateAsync }),
  useRejectOutfit: () => ({ isPending: mocks.rejectPending, mutateAsync: mocks.rejectMutateAsync }),
  useSubmitOutfitFeedback: () => ({ isPending: mocks.feedbackPending, mutateAsync: mocks.feedbackMutateAsync }),
}))

function makeOutfit(status = 'pending'): Outfit {
  return {
    id: 'outfit-1',
    occasion: 'casual',
    scheduled_for: '2026-05-01',
    status,
    source: 'manual',
    name: '休闲',
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
    created_at: '2026-05-01T00:00:00Z',
    items: [
      {
        id: 'item-1',
        type: 'outerwear',
        subtype: null,
        name: '夹克',
        primary_color: null,
        colors: [],
        image_path: '',
        thumbnail_path: null,
        image_url: undefined,
        thumbnail_url: undefined,
        layer_type: null,
        position: 0,
      },
    ],
  } as Outfit
}

describe('OutfitDetailSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.acceptPending = false
    mocks.deletePending = false
    mocks.feedbackPending = false
    mocks.rejectPending = false
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the updated accepted state returned by the accept mutation', async () => {
    mocks.acceptMutateAsync.mockResolvedValue(makeOutfit('accepted'))

    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    render(
      <OutfitDetailSheet
        outfit={makeOutfit('pending')}
        visible
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('接受'))

    await waitFor(() => {
      expect(screen.getByText('已接受')).toBeTruthy()
    })
    expect(screen.getByText('评价穿搭')).toBeTruthy()
    expect(screen.queryByText('拒绝')).toBeNull()
  })

  it('keeps pending accept and reject actions large enough for touch', async () => {
    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    render(
      <OutfitDetailSheet
        outfit={makeOutfit('pending')}
        visible
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('接受').parentElement?.style.minHeight).toBe('44px')
    expect(screen.getByText('拒绝').parentElement?.style.minHeight).toBe('44px')
  })

  it('exposes outfit actions as accessible buttons', async () => {
    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    render(
      <OutfitDetailSheet
        outfit={makeOutfit('pending')}
        visible
        onClose={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '接受' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '拒绝' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '删除穿搭' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '删除穿搭' }))

    expect(screen.getByRole('button', { name: '取消' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '确认删除' })).toBeTruthy()
  })

  it('exposes feedback actions as accessible buttons', async () => {
    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    render(
      <OutfitDetailSheet
        outfit={makeOutfit('accepted')}
        visible
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '评价穿搭' }))

    expect(screen.getByRole('button', { name: '取消' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '提交' })).toBeTruthy()
  })

  it('marks accepted outfit feedback as worn so item wear counts update', async () => {
    mocks.feedbackMutateAsync.mockResolvedValue({
      ...makeOutfit('accepted'),
      feedback: {
        rating: 3,
        comment: null,
        worn_at: '2026-05-01',
        actually_worn: true,
        wore_instead_items: null,
      },
    })

    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    render(
      <OutfitDetailSheet
        outfit={makeOutfit('accepted')}
        visible
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('评价穿搭'))
    fireEvent.click(screen.getByText('提交'))

    await waitFor(() => {
      expect(mocks.feedbackMutateAsync).toHaveBeenCalledWith({
        outfitId: 'outfit-1',
        feedback: {
          rating: 3,
          actually_worn: true,
          worn: true,
        },
      })
    })
  })

  it('previews outfit item images in the detail sheet', async () => {
    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    const { container } = render(
      <OutfitDetailSheet
        outfit={{
          ...makeOutfit('pending'),
          items: [
            {
              id: 'item-1',
              type: 'outerwear',
              subtype: null,
              name: '夹克',
              primary_color: null,
              colors: [],
              image_path: '/jacket.jpg',
              thumbnail_path: '/jacket-thumb.jpg',
              image_url: 'https://cdn.test/jacket-full.jpg',
              thumbnail_url: 'https://cdn.test/jacket-thumb.jpg',
              layer_type: null,
              position: 0,
            },
          ],
        }}
        visible
        onClose={vi.fn()}
      />
    )

    const image = container.querySelector('img')
    const imageSurface = container.querySelector('[aria-label="查看夹克大图"]') as HTMLElement | null
    expect(image).toBeNull()
    expect(imageSurface).not.toBeNull()
    expect(imageSurface?.tagName).toBe('DIV')
    expect(imageSurface?.style.height).toBe('172px')
    expect(imageSurface?.style.backgroundImage).toContain('https://cdn.test/jacket-thumb.jpg')

    fireEvent.click(imageSurface!)

    expect(mocks.previewImage).toHaveBeenCalledWith({
      current: 'https://cdn.test/jacket-full.jpg',
      urls: ['https://cdn.test/jacket-full.jpg'],
    })
  })

  it('places the outfit imagery before narrative details in the detail sheet', async () => {
    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    const { container } = render(
      <OutfitDetailSheet
        outfit={{
          ...makeOutfit('pending'),
          reasoning: '先看图，再解释为什么这样搭。',
          highlights: ['图片应该优先承载穿搭信息。'],
          items: [
            {
              id: 'item-1',
              type: 'outerwear',
              subtype: null,
              name: '夹克',
              primary_color: null,
              colors: [],
              image_path: '/jacket.jpg',
              thumbnail_path: '/jacket-thumb.jpg',
              image_url: 'https://cdn.test/jacket-full.jpg',
              thumbnail_url: 'https://cdn.test/jacket-thumb.jpg',
              layer_type: null,
              position: 0,
            },
          ],
        }}
        visible
        onClose={vi.fn()}
      />
    )

    const imageSurface = container.querySelector('[aria-label="查看夹克大图"]') as HTMLElement | null
    const reasoning = screen.getByText('先看图，再解释为什么这样搭。')

    expect(imageSurface).not.toBeNull()
    expect(imageSurface!.compareDocumentPosition(reasoning) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('uses plain view scrolling instead of scroll-view in the detail sheet', async () => {
    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    const { container } = render(
      <OutfitDetailSheet
        outfit={makeOutfit('pending')}
        visible
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByTestId('native-scroll-view')).toBeNull()
    expect(container.firstElementChild?.getAttribute('data-catch-move')).toBe('true')
    const backdrop = Array.from(container.querySelectorAll('div')).find((element) => element.style.backgroundColor === 'rgba(0, 0, 0, 0.5)')
    expect(backdrop?.dataset.catchMove).toBe('true')
    const sheetPanel = Array.from(container.querySelectorAll('div')).find((element) => element.style.maxHeight === '82vh')
    expect(sheetPanel?.dataset.catchMove).toBe('true')
    const scrollBody = Array.from(container.querySelectorAll('div')).find((element) => element.style.overflowY === 'auto')
    expect(scrollBody?.dataset.catchMove).toBe('true')
    expect(scrollBody?.style.overscrollBehavior).toBe('contain')
  })

  it('hides the native tab bar while the detail sheet is visible', async () => {
    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    const { unmount } = render(
      <OutfitDetailSheet
        outfit={makeOutfit('pending')}
        visible
        onClose={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(mocks.hideTabBar).toHaveBeenCalledWith({ animation: false })
    })

    unmount()

    await waitFor(() => {
      expect(mocks.showTabBar).toHaveBeenCalledWith({ animation: false })
    })
  })

  it('does not submit pending outfit actions again', async () => {
    mocks.acceptPending = true
    mocks.rejectPending = true
    mocks.deletePending = true
    mocks.feedbackPending = true
    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    render(
      <OutfitDetailSheet
        outfit={makeOutfit('pending')}
        visible
        onClose={vi.fn()}
      />
    )

    const acceptButton = screen.getByRole('button', { name: '接受' })
    const rejectButton = screen.getByRole('button', { name: '拒绝' })
    expect(acceptButton.style.opacity).toBe('0.7')
    expect(rejectButton.style.opacity).toBe('0.7')

    fireEvent.click(acceptButton)
    fireEvent.click(rejectButton)
    fireEvent.click(screen.getByRole('button', { name: '删除穿搭' }))

    expect(mocks.acceptMutateAsync).not.toHaveBeenCalled()
    expect(mocks.rejectMutateAsync).not.toHaveBeenCalled()
    expect(mocks.deleteMutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: '确认删除' })).toBeNull()

    cleanup()

    render(
      <OutfitDetailSheet
        outfit={makeOutfit('accepted')}
        visible
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '评价穿搭' }))
    const submitButton = screen.getByRole('button', { name: '提交' })
    expect(submitButton.style.opacity).toBe('0.7')
    fireEvent.click(submitButton)

    expect(mocks.feedbackMutateAsync).not.toHaveBeenCalled()
  })

  it('renders narrative detail blocks as flat sections instead of nested cards', async () => {
    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    render(
      <OutfitDetailSheet
        outfit={{
          ...makeOutfit('accepted'),
          style_notes: '搭配建议正文',
          weather: {
            temperature: 22,
            feels_like: 21,
            humidity: 60,
            precipitation_chance: 20,
            condition: 'clear',
          },
        } as Outfit}
        visible
        onClose={vi.fn()}
      />
    )

    const styleNotesSectionStyle = screen.getByText('搭配建议').closest('div')?.getAttribute('style') ?? ''
    const weatherSectionStyle = screen.getByText('天气').closest('div')?.getAttribute('style') ?? ''

    expect(styleNotesSectionStyle).toContain('border-top')
    expect(styleNotesSectionStyle).not.toContain('background-color')
    expect(styleNotesSectionStyle).not.toContain('border-radius')
    expect(weatherSectionStyle).toContain('border-top')
    expect(weatherSectionStyle).not.toContain('background-color')
    expect(weatherSectionStyle).not.toContain('border-radius')
  })

  it('renders the feedback form as a flat sheet section', async () => {
    const { OutfitDetailSheet } = await import('./outfit-detail-sheet')

    render(
      <OutfitDetailSheet
        outfit={makeOutfit('accepted')}
        visible
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('评价穿搭'))

    const feedbackFormStyle = screen.getByText('评价这套穿搭').closest('div')?.getAttribute('style') ?? ''

    expect(feedbackFormStyle).toContain('border-top')
    expect(feedbackFormStyle).not.toContain('background-color')
    expect(feedbackFormStyle).not.toContain('border-radius')
  })
})
