import { describe, expect, it } from 'vitest'

import {
  getWardrobeFilterPanelStyle,
  getWardrobeItemCardShellStyle,
  getWardrobeSectionCardStyle,
} from './look-and-feel'

describe('wardrobe look and feel', () => {
  it('uses a lighter raised panel style for the filter block', () => {
    expect(getWardrobeFilterPanelStyle()).toMatchObject({
      backgroundColor: 'var(--wb-color-surface-raised)',
      borderRadius: '22px',
      padding: '18px',
    })
  })

  it('gives item cards a more editorial shell without heavy borders', () => {
    expect(getWardrobeItemCardShellStyle()).toMatchObject({
      backgroundColor: 'var(--wb-color-surface)',
      borderRadius: '22px',
      border: '1px solid rgba(9, 9, 11, 0.06)',
    })
  })

  it('keeps the section card base aligned with the brighter wardrobe direction', () => {
    expect(getWardrobeSectionCardStyle()).toMatchObject({
      backgroundColor: 'var(--wb-color-surface-raised)',
      borderRadius: '22px',
    })
  })
})
