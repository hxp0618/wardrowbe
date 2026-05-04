// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  previewImage: vi.fn(),
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
    onClick?: React.MouseEventHandler<HTMLDivElement>
    style?: React.CSSProperties
  }) => <div aria-label={ariaLabel} role={ariaRole} onClick={onClick} style={style}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    previewImage: mocks.previewImage,
  },
}))

describe('OutfitImageGrid', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders a reusable image-first outfit preview grid', async () => {
    const { OutfitImageGrid } = await import('./outfit-image-grid')
    const { container } = render(
      <OutfitImageGrid
        items={[
          {
            id: 'item-1',
            name: 'Blue Jacket',
            type: 'jacket',
            image_url: 'original-jacket.jpg',
            medium_url: 'medium-jacket.jpg',
            thumbnail_url: 'thumb-jacket.jpg',
          },
          {
            id: 'item-2',
            name: 'White Shirt',
            type: 'shirt',
            image_url: 'original-shirt.jpg',
            medium_url: 'medium-shirt.jpg',
            thumbnail_url: 'thumb-shirt.jpg',
          },
        ]}
        imageAriaLabel={(label) => `查看 ${label} 大图`}
      />
    )

    const imageSurface = screen.getByLabelText('查看 Blue Jacket 大图')
    expect(container.firstElementChild?.getAttribute('style')).toContain('height: 172px')
    expect(imageSurface.getAttribute('style')).toContain('height: 172px')
    expect(imageSurface.getAttribute('style')).toContain('thumb-jacket.jpg')

    fireEvent.click(imageSurface)

    expect(mocks.previewImage).toHaveBeenCalledWith({
      current: 'original-jacket.jpg',
      urls: ['original-jacket.jpg', 'original-shirt.jpg'],
    })
  })

  it('can use fill-height cells for card previews', async () => {
    const { OutfitImageGrid } = await import('./outfit-image-grid')
    render(
      <OutfitImageGrid
        itemHeightMode='fill'
        items={[
          {
            id: 'item-1',
            name: 'Blue Jacket',
            type: 'jacket',
            image_url: 'original-jacket.jpg',
            thumbnail_url: 'thumb-jacket.jpg',
          },
        ]}
      />
    )

    expect(screen.getByLabelText('查看Blue Jacket大图').getAttribute('style')).toContain('height: 100%')
  })

  it('renders an empty image area without adding a nested card', async () => {
    const { OutfitImageGrid } = await import('./outfit-image-grid')
    const { container } = render(<OutfitImageGrid items={[]} />)

    expect(screen.getByText('暂无图片')).toBeTruthy()
    expect(container.firstElementChild?.getAttribute('style')).toContain('border-radius: 8px')
    expect(container.firstElementChild?.getAttribute('style')).not.toContain('border:')
  })
})
