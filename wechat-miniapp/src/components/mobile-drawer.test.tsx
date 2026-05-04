// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  onClose: vi.fn(),
  redirectTo: vi.fn(),
  hideTabBar: vi.fn(),
  showTabBar: vi.fn(),
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
    catchMove,
    children,
    hidden,
    onClick,
    style,
  }: {
    ariaLabel?: string
    ariaRole?: string
    catchMove?: boolean
    children?: React.ReactNode
    hidden?: boolean
    onClick?: () => void
    style?: React.CSSProperties
  }) => <div aria-label={ariaLabel} data-catch-move={catchMove == null ? undefined : String(catchMove)} hidden={hidden} role={ariaRole} onClick={onClick} style={style}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getMenuButtonBoundingClientRect: vi.fn(() => ({ height: 32, left: 320, top: 52 })),
    getWindowInfo: vi.fn(() => ({ statusBarHeight: 44 })),
    hideTabBar: mocks.hideTabBar,
    navigateTo: mocks.navigateTo,
    redirectTo: mocks.redirectTo,
    showTabBar: mocks.showTabBar,
    switchTab: mocks.switchTab,
  },
}))

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => ({
      drawer_section_settings: '设置与协作',
      drawer_title: '导航',
      drawer_close: '关闭导航',
      drawer_dismiss: '关闭导航',
      nav_analytics: '分析',
      nav_dashboard: '首页',
      nav_family: '家庭',
      nav_family_feed: '家庭动态',
      nav_history: '历史',
      nav_learning: '学习',
      nav_notifications: '通知',
      nav_outfits: '穿搭',
      nav_pairings: '配对',
      nav_settings: '设置',
      nav_suggest: '推荐',
      nav_wardrobe: '衣橱',
    }[key] ?? key),
  }),
}))

vi.mock('./header-metrics', () => ({
  getHeaderChromeHeight: () => 88,
  resolveHeaderMetrics: () => ({ capsuleHeight: 32, statusBarHeight: 44 }),
}))

vi.mock('./ui-theme', () => ({
  colors: {
    accent: '#111',
    accentText: '#fff',
    border: '#ddd',
    surface: '#fff',
    surfaceMuted: '#f7f7f7',
    text: '#111',
    textMuted: '#666',
    textSoft: '#999',
  },
}))

describe('MobileDrawer', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses reliable touch targets for drawer navigation and close controls', async () => {
    const { MobileDrawer } = await import('./mobile-drawer')

    render(<MobileDrawer open activeKey={null} onClose={mocks.onClose} />)

    expect(screen.getByText('分析').parentElement?.style.minHeight).toBe('44px')
    expect(screen.getByText('×').parentElement?.style.width).toBe('44px')
    expect(screen.getByText('×').parentElement?.style.height).toBe('44px')
    expect(screen.getByRole('button', { name: '分析' }).style.minHeight).toBe('44px')
    expect(screen.getByText('×').parentElement?.getAttribute('role')).toBe('button')
    expect(screen.getByText('×').parentElement?.getAttribute('aria-label')).toBe('关闭导航')
  })

  it('contains drawer scrolling and blocks background scroll while open', async () => {
    const { MobileDrawer } = await import('./mobile-drawer')

    const { container } = render(<MobileDrawer open activeKey={null} onClose={mocks.onClose} />)
    const fixedSurfaces = Array.from(container.querySelectorAll('div')).filter(
      (element) => element.style.position === 'fixed'
    )
    const backdrop = fixedSurfaces.find((element) => element.style.zIndex === '49')
    const drawer = fixedSurfaces.find((element) => element.style.zIndex === '50')

    expect(backdrop?.dataset.catchMove).toBe('true')
    expect(drawer?.dataset.catchMove).toBe('true')
    expect(drawer?.style.overflowY).toBe('auto')
    expect(drawer?.style.overscrollBehavior).toBe('contain')
  })

  it('hides the native tab bar while the drawer is open', async () => {
    const { MobileDrawer } = await import('./mobile-drawer')

    const { unmount } = render(<MobileDrawer open activeKey={null} onClose={mocks.onClose} />)

    expect(mocks.hideTabBar).toHaveBeenCalledWith({ animation: false })

    unmount()

    expect(mocks.showTabBar).toHaveBeenCalledWith({ animation: false })
  })

  it('removes the drawer subtree from presentation when closed', async () => {
    const { MobileDrawer } = await import('./mobile-drawer')

    const { container } = render(<MobileDrawer open={false} activeKey={null} onClose={mocks.onClose} />)

    expect(container.firstElementChild).toBeNull()
  })

  it('falls back to redirecting when page navigation times out', async () => {
    mocks.navigateTo.mockRejectedValueOnce(new Error('navigateTo:fail timeout'))
    const { MobileDrawer } = await import('./mobile-drawer')

    render(<MobileDrawer open activeKey={null} onClose={mocks.onClose} />)

    fireEvent.click(screen.getByText('分析'))

    await waitFor(() => {
      expect(mocks.redirectTo).toHaveBeenCalledWith({
        url: '/pages/analytics/index',
      })
    })
  })

  it('reuses tab image assets for primary drawer tab destinations', async () => {
    const { MobileDrawer } = await import('./mobile-drawer')

    render(<MobileDrawer open activeKey={null} onClose={mocks.onClose} />)

    const wardrobeIcon = screen.getByRole('img', { name: '衣橱 图标' }) as HTMLImageElement

    expect(wardrobeIcon.getAttribute('src')).toBe('/assets/tabbar/wardrobe.png')
    expect(screen.queryByText('⌘')).toBeNull()
  })
})
