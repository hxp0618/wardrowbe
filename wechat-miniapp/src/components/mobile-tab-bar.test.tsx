// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  switchTab: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  Image: ({
    ariaLabel,
    src,
    style,
  }: {
    ariaLabel?: string
    src?: string
    style?: React.CSSProperties
  }) => <img alt={ariaLabel ?? ''} aria-label={ariaLabel} src={src} style={style} />,
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
    onClick?: () => void
    style?: React.CSSProperties
  }) => <div aria-label={ariaLabel} role={ariaRole} onClick={onClick} style={style}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    switchTab: mocks.switchTab,
  },
}))

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('MobileTabBar', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('uses a restrained shell instead of a floating oversized card', async () => {
    const { MobileTabBar } = await import('./mobile-tab-bar')

    const { container } = render(<MobileTabBar activeKey='dashboard' />)

    const shell = container.firstElementChild as HTMLElement
    expect(shell.style.borderRadius).toBe('8px')
    expect(shell.style.boxShadow).toBe('')
  })

  it('switches tabs from the visible tab target', async () => {
    const { MobileTabBar } = await import('./mobile-tab-bar')

    render(<MobileTabBar activeKey='dashboard' />)

    fireEvent.click(screen.getByText('nav_wardrobe').parentElement!)

    expect(mocks.switchTab).toHaveBeenCalledWith({ url: '/pages/wardrobe/index' })
  })

  it('exposes tab targets as labeled buttons with reliable height', async () => {
    const { MobileTabBar } = await import('./mobile-tab-bar')

    render(<MobileTabBar activeKey='dashboard' />)

    const wardrobeTab = screen.getByRole('button', { name: 'nav_wardrobe' })

    expect(wardrobeTab.style.minHeight).toBe('44px')
  })

  it('uses shared tab image assets instead of glyph-only icons', async () => {
    const { MobileTabBar } = await import('./mobile-tab-bar')

    render(<MobileTabBar activeKey='dashboard' />)

    const wardrobeIcon = screen.getByRole('img', { name: 'nav_wardrobe 图标' }) as HTMLImageElement

    expect(wardrobeIcon.getAttribute('src')).toBe('/assets/tabbar/wardrobe.png')
    expect(screen.queryByText('⌘')).toBeNull()
  })
})
