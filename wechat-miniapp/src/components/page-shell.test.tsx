// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tarojs/components', () => ({
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
    getCurrentInstance: vi.fn(() => ({ router: { path: '/pages/wardrobe/index' } })),
    getMenuButtonBoundingClientRect: vi.fn(() => ({ height: 32, top: 52 })),
    getWindowInfo: vi.fn(() => ({ statusBarHeight: 44 })),
  },
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: (selector: (state: { appearance: 'light' }) => unknown) =>
    selector({ appearance: 'light' }),
}))

vi.mock('./app-header', () => ({
  AppHeader: ({ onMenuClick }: { onMenuClick?: () => void }) => (
    <button type='button' onClick={onMenuClick}>
      open-menu
    </button>
  ),
}))

vi.mock('./mobile-drawer', () => ({
  MobileDrawer: ({
    onClose,
    open,
  }: {
    onClose: () => void
    open: boolean
  }) =>
    open ? (
      <section aria-label='drawer'>
        <button type='button' onClick={onClose}>
          close-drawer
        </button>
      </section>
    ) : null,
  resolveMobileDrawerKey: () => 'wardrobe',
}))

vi.mock('./mobile-tab-bar', () => ({
  MobileTabBar: () => <nav aria-label='mobile-tab-bar'>tabbar</nav>,
}))

vi.mock('./ui-theme', () => ({
  colors: {
    page: '#fff',
    text: '#111',
    textMuted: '#666',
  },
  getThemeStyle: () => ({}),
  pagePadding: '16px',
  subtitleTextStyle: {},
  titleTextStyle: {},
}))

vi.mock('./header-metrics', () => ({
  getHeaderChromeHeight: () => 88,
  resolveHeaderMetrics: () => ({ statusBarHeight: 44 }),
}))

describe('PageShell', () => {
  afterEach(() => {
    cleanup()
  })

  it('removes the custom mobile tab bar while the drawer is open', async () => {
    const { PageShell } = await import('./page-shell')

    render(
      <PageShell navKey='wardrobe'>
        <span>content</span>
      </PageShell>
    )

    expect(screen.getByLabelText('mobile-tab-bar')).toBeTruthy()

    fireEvent.click(screen.getByText('open-menu'))

    expect(screen.getByLabelText('drawer')).toBeTruthy()
    expect(screen.queryByLabelText('mobile-tab-bar')).toBeNull()

    fireEvent.click(screen.getByText('close-drawer'))

    expect(screen.getByLabelText('mobile-tab-bar')).toBeTruthy()
  })
})
