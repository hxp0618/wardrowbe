// @vitest-environment jsdom

import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Outfit } from '../services/types'

const mocks = vi.hoisted(() => ({
  acceptMutateAsync: vi.fn(),
  rejectMutateAsync: vi.fn(),
  deleteMutateAsync: vi.fn(),
  feedbackMutateAsync: vi.fn(),
  showToast: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  Image: ({ src }: { src?: string }) => <img alt='' src={src} />,
  ScrollView: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Slider: () => <input aria-label='rating' type='range' />,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Textarea: () => <textarea />,
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
    showToast: mocks.showToast,
  },
}))

vi.mock('../hooks/use-outfits', () => ({
  useAcceptOutfit: () => ({ mutateAsync: mocks.acceptMutateAsync }),
  useDeleteOutfit: () => ({ mutateAsync: mocks.deleteMutateAsync }),
  useRejectOutfit: () => ({ mutateAsync: mocks.rejectMutateAsync }),
  useSubmitOutfitFeedback: () => ({ mutateAsync: mocks.feedbackMutateAsync }),
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
})
