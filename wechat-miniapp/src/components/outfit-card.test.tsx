// @vitest-environment jsdom

import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Outfit } from '../services/types'

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

function makeOutfit(): Outfit {
  return {
    id: 'outfit-1',
    occasion: 'casual',
    scheduled_for: '2026-05-01',
    status: 'pending',
    source: 'manual',
    name: '周末穿搭',
    replaces_outfit_id: null,
    cloned_from_outfit_id: null,
    reasoning: '适合周末出门。',
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
        type: 'shirt',
        subtype: null,
        name: '衬衫',
        primary_color: null,
        colors: [],
        image_path: '/shirt.jpg',
        thumbnail_path: '/shirt-thumb.jpg',
        image_url: 'https://cdn.test/shirt-full.jpg',
        thumbnail_url: 'https://cdn.test/shirt-thumb.jpg',
        layer_type: 'top',
        position: 0,
      },
      {
        id: 'item-2',
        type: 'pants',
        subtype: null,
        name: '长裤',
        primary_color: null,
        colors: [],
        image_path: '/pants.jpg',
        thumbnail_path: '/pants-thumb.jpg',
        image_url: 'https://cdn.test/pants-full.jpg',
        thumbnail_url: 'https://cdn.test/pants-thumb.jpg',
        layer_type: 'bottom',
        position: 1,
      },
    ],
  } as Outfit
}

describe('OutfitCard', () => {
  it('previews outfit item images without bubbling to the outer card action', async () => {
    const { OutfitCard } = await import('./outfit-card')

    const { container } = render(
      <div onClick={mocks.openDetail}>
        <OutfitCard outfit={makeOutfit()} />
      </div>
    )

    const card = container.firstElementChild?.firstElementChild as HTMLElement | null
    const image = container.querySelector('img')
    const imageSurface = container.querySelector('[aria-label="查看衬衫大图"]') as HTMLElement | null
    const mosaic = imageSurface?.parentElement?.parentElement as HTMLElement | null

    expect(card?.style.borderRadius).toBe('8px')
    expect(mosaic?.style.borderRadius).toBe('8px')
    expect(image).toBeNull()
    expect(imageSurface).not.toBeNull()
    expect(imageSurface?.tagName).toBe('DIV')
    expect(imageSurface?.style.backgroundImage).toContain('https://cdn.test/shirt-thumb.jpg')

    fireEvent.click(imageSurface!)

    expect(mocks.previewImage).toHaveBeenCalledWith({
      current: 'https://cdn.test/shirt-full.jpg',
      urls: ['https://cdn.test/shirt-full.jpg', 'https://cdn.test/pants-full.jpg'],
    })
    expect(mocks.openDetail).not.toHaveBeenCalled()
  })
})
