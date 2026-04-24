import { describe, expect, it, vi } from 'vitest'

vi.mock('@tarojs/components', () => ({
  Text: 'text',
  View: 'view',
}))

vi.mock('@tarojs/taro', () => ({
  default: {},
}))

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

import { resolveMobileDrawerLayout } from './mobile-drawer'

describe('resolveMobileDrawerLayout', () => {
  it('pushes the drawer header below the mini-program top chrome', () => {
    expect(resolveMobileDrawerLayout(68, undefined)).toMatchObject({
      paddingTop: '72px',
      headerPaddingRight: '0px',
    })
  })

  it('reserves extra header space when the capsule overlaps the drawer width', () => {
    expect(resolveMobileDrawerLayout(68, 278)).toMatchObject({
      paddingTop: '72px',
      headerPaddingRight: '22px',
    })
  })
})
