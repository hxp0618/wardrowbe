// @vitest-environment jsdom

import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Item } from '../services/types'

const mocks = vi.hoisted(() => ({
  openDetail: vi.fn(),
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
  }) => <img alt={ariaLabel ?? ''} aria-label={ariaLabel} onClick={onClick} src={src} style={style} />,
  Text: ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => <span style={style}>{children}</span>,
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
    onClick?: React.MouseEventHandler<HTMLDivElement>
    style?: React.CSSProperties
  }) => <div aria-label={ariaLabel} role={ariaRole} onClick={onClick} style={style}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    previewImage: mocks.previewImage,
  },
}))

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    user_id: 'user-1',
    type: 'shirt',
    subtype: '短袖衬衫',
    name: '蓝色衬衫',
    favorite: false,
    image_path: '/shirt.jpg',
    thumbnail_path: '/shirt-thumb.jpg',
    medium_path: '/shirt-medium.jpg',
    image_url: 'https://cdn.test/shirt-full.jpg',
    thumbnail_url: 'https://cdn.test/shirt-thumb.jpg',
    medium_url: 'https://cdn.test/shirt-medium.jpg',
    tags: { colors: [], style: [], season: [] },
    colors: [],
    primary_color: undefined,
    status: 'ready',
    ai_processed: true,
    wear_count: 3,
    suggestion_count: 0,
    acceptance_count: 0,
    wears_since_wash: 0,
    needs_wash: false,
    effective_wash_interval: 3,
    quantity: 1,
    additional_images: [
      {
        id: 'image-2',
        item_id: 'item-1',
        image_path: '/shirt-side.jpg',
        thumbnail_path: '/shirt-side-thumb.jpg',
        medium_path: '/shirt-side-medium.jpg',
        position: 1,
        created_at: '2026-05-01T00:00:00Z',
        image_url: 'https://cdn.test/shirt-side-full.jpg',
        thumbnail_url: 'https://cdn.test/shirt-side-thumb.jpg',
        medium_url: 'https://cdn.test/shirt-side-medium.jpg',
      },
    ],
    folders: [],
    is_archived: false,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    ...overrides,
  }
}

describe('ItemCard', () => {
  it('uses the wardrobe image as the primary surface and previews full images without opening the card', async () => {
    const { ItemCard } = await import('./item-card')

    const { container } = render(
      <div onClick={mocks.openDetail}>
        <ItemCard item={makeItem()} variant='wardrobe' />
      </div>
    )

    const image = container.querySelector('img')
    const imageSurface = container.querySelector('[aria-label="查看蓝色衬衫大图"]') as HTMLElement | null
    const card = container.firstElementChild?.firstElementChild as HTMLElement | null

    expect(card?.style.borderRadius).toBe('8px')
    expect(image).toBeNull()
    expect(imageSurface).not.toBeNull()
    expect(imageSurface?.tagName).toBe('DIV')
    expect(imageSurface?.style.backgroundImage).toContain('https://cdn.test/shirt-thumb.jpg')
    expect(imageSurface?.style.width).toBe('100%')
    expect(imageSurface?.style.borderRadius).toBe('8px 8px 6px 6px')

    fireEvent.click(imageSurface!)

    expect(mocks.previewImage).toHaveBeenCalledWith({
      current: 'https://cdn.test/shirt-full.jpg',
      urls: ['https://cdn.test/shirt-full.jpg', 'https://cdn.test/shirt-side-full.jpg'],
    })
    expect(mocks.openDetail).not.toHaveBeenCalled()
  })
})
