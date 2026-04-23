import type { ReactElement } from 'react'

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tarojs/components', () => ({
  Text: 'text',
  View: 'view',
  Picker: 'picker',
}))

vi.mock('@tarojs/taro', () => ({
  default: {},
}))

vi.mock('../hooks/use-user', () => ({
  useUserProfile: () => ({ data: null }),
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => 'zh',
}))

describe('createPageShellHeader', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('wires the default header menu action to the provided callback', () => {
    const onOpenMenu = vi.fn()
    return Promise.all([import('./page-shell'), import('./app-header')]).then(
      ([pageShellModule, appHeaderModule]) => {
        const header = pageShellModule.createPageShellHeader(
          undefined,
          onOpenMenu
        ) as ReactElement

        expect(header?.type).toBe(appHeaderModule.AppHeader)
        expect(header?.props.onMenuClick).toBe(onOpenMenu)
      }
    )
  })

  it('keeps an explicit null header without injecting a menu action', () => {
    const onOpenMenu = vi.fn()
    return import('./page-shell').then((pageShellModule) => {
      expect(pageShellModule.createPageShellHeader(null, onOpenMenu)).toBeNull()
    })
  })
})
