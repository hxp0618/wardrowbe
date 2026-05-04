// @vitest-environment jsdom

import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  openParent: vi.fn(),
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

describe('PreviewableImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('previews the image gallery without bubbling to parent actions', async () => {
    const { PreviewableImage } = await import('./previewable-image')

    const { container } = render(
      <div onClick={mocks.openParent}>
        <PreviewableImage
          ariaLabel='查看正面大图'
          src='tmp://front.jpg'
          previewUrls={['tmp://front.jpg', 'tmp://back.jpg']}
          style={{ width: '100%' }}
        />
      </div>
    )

    const image = container.querySelector('img')
    const surface = container.querySelector('[aria-label="查看正面大图"]') as HTMLElement | null
    expect(image).toBeNull()
    expect(surface).not.toBeNull()
    expect(surface?.tagName).toBe('DIV')
    expect(surface?.getAttribute('role')).toBe('button')
    expect(surface?.style.backgroundImage).toContain('tmp://front.jpg')

    fireEvent.click(surface!)

    expect(mocks.previewImage).toHaveBeenCalledWith({
      current: 'tmp://front.jpg',
      urls: ['tmp://front.jpg', 'tmp://back.jpg'],
    })
    expect(mocks.openParent).not.toHaveBeenCalled()
  })

  it('can display a thumbnail while previewing the original image', async () => {
    const { PreviewableImage } = await import('./previewable-image')

    const { container } = render(
      <PreviewableImage
        src='https://cdn.test/item-thumb.jpg'
        previewCurrent='https://cdn.test/item-full.jpg'
        previewUrls={['https://cdn.test/item-full.jpg']}
      />
    )

    const surface = container.querySelector('[aria-label="查看图片大图"]') as HTMLElement | null
    expect(container.querySelector('img')).toBeNull()
    expect(surface).not.toBeNull()
    expect(surface?.getAttribute('role')).toBe('button')

    fireEvent.click(surface!)

    expect(mocks.previewImage).toHaveBeenCalledWith({
      current: 'https://cdn.test/item-full.jpg',
      urls: ['https://cdn.test/item-full.jpg'],
    })
  })
})
