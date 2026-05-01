// @vitest-environment jsdom

import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Item } from '../services/types'

const mocks = vi.hoisted(() => ({
  archiveMutateAsync: vi.fn(),
  deleteMutateAsync: vi.fn(),
  favoriteMutateAsync: vi.fn(),
  logWashMutateAsync: vi.fn(),
  logWearMutateAsync: vi.fn(),
  needsWashMutateAsync: vi.fn(),
  reanalyzeMutateAsync: vi.fn(),
  showToast: vi.fn(),
  unarchiveMutateAsync: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  Image: ({ src }: { src?: string }) => <img alt='' src={src} />,
  Picker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ScrollView: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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
    previewImage: vi.fn(),
    showToast: mocks.showToast,
  },
}))

vi.mock('../hooks/use-items', () => ({
  useArchiveItem: () => ({ mutateAsync: mocks.archiveMutateAsync }),
  useDeleteItem: () => ({ mutateAsync: mocks.deleteMutateAsync }),
  useLogWash: () => ({ mutateAsync: mocks.logWashMutateAsync }),
  useLogWear: () => ({ mutateAsync: mocks.logWearMutateAsync }),
  useReanalyzeItem: () => ({ mutateAsync: mocks.reanalyzeMutateAsync }),
  useToggleFavorite: () => ({ mutateAsync: mocks.favoriteMutateAsync }),
  useToggleNeedsWash: () => ({ mutateAsync: mocks.needsWashMutateAsync }),
  useUnarchiveItem: () => ({ mutateAsync: mocks.unarchiveMutateAsync }),
}))

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    type: 'shirt',
    subtype: '短袖衬衫',
    name: 'Shirt',
    brand: null,
    image_path: '/shirt.jpg',
    thumbnail_path: null,
    medium_path: null,
    image_url: 'http://example.test/shirt.jpg',
    thumbnail_url: null,
    medium_url: null,
    additional_images: [],
    tags: {
      style: ['casual'],
      season: ['春季'],
      material: '棉',
      pattern: '格纹',
    },
    colors: [],
    primary_color: null,
    status: 'ready',
    ai_confidence: null,
    ai_description: '棕色短袖衬衫',
    wear_count: 0,
    last_worn_at: null,
    name_source: 'manual',
    favorite: false,
    is_archived: false,
    archived_at: null,
    archive_reason: null,
    notes: null,
    quantity: 1,
    needs_wash: false,
    wears_since_wash: 0,
    last_washed_at: null,
    wash_interval: null,
    folders: [],
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    ...overrides,
  } as Item
}

describe('ItemDetailSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the updated favorite state returned by the mutation', async () => {
    mocks.favoriteMutateAsync
      .mockResolvedValueOnce(makeItem({ favorite: true }))
      .mockResolvedValueOnce(makeItem({ favorite: false }))

    const { ItemDetailSheet } = await import('./item-detail-sheet')

    render(
      <ItemDetailSheet
        item={makeItem({ favorite: false })}
        visible
        onClose={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('收藏'))

    await waitFor(() => {
      expect(screen.getByText('已收藏')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('已收藏'))

    await waitFor(() => {
      expect(mocks.favoriteMutateAsync).toHaveBeenLastCalledWith({
        id: 'item-1',
        favorite: false,
      })
    })
    expect(screen.getByText('收藏')).toBeTruthy()
  })
})
