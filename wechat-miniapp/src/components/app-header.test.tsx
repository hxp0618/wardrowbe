// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
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
    getAppBaseInfo: vi.fn(() => ({ statusBarHeight: 44 })),
    getMenuButtonBoundingClientRect: vi.fn(() => ({ height: 32, left: 320, right: 407, top: 52, width: 87 })),
    getWindowInfo: vi.fn(() => ({ screenWidth: 430, statusBarHeight: 44, windowWidth: 430 })),
  },
}))

vi.mock('../hooks/use-user', () => ({
  useUserProfile: () => ({
    data: {
      display_name: 'Dev User',
    },
  }),
}))

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../lib/storage', () => ({
  setStoredAppearance: vi.fn(),
}))

describe('AppHeader', () => {
  afterEach(() => {
    cleanup()
  })

  it('uses 44px touch targets for the global menu and theme controls', async () => {
    const { AppHeader } = await import('./app-header')

    render(<AppHeader onMenuClick={vi.fn()} />)

    const menuButton = screen.getByText('≡').parentElement
    const themeButton = screen.getByText('☀').parentElement

    expect(menuButton?.style.width).toBe('44px')
    expect(menuButton?.style.height).toBe('44px')
    expect(themeButton?.style.width).toBe('44px')
    expect(themeButton?.style.height).toBe('44px')
  })

  it('labels the global menu and theme controls as buttons', async () => {
    const { AppHeader } = await import('./app-header')

    render(<AppHeader onMenuClick={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'app_header_open_menu' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'app_header_toggle_theme' })).toBeTruthy()
  })
})
