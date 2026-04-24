import { describe, expect, it } from 'vitest'

import {
  getWardrobeChipStyle,
  getWardrobeCompactActionStyle,
  getWardrobePickerStyle,
} from './controls-style'

describe('wardrobe filter control styles', () => {
  it('uses a tighter picker shell for compact filter controls', () => {
    expect(getWardrobePickerStyle()).toMatchObject({
      minHeight: '40px',
      borderRadius: '12px',
      padding: '0 12px',
      backgroundColor: 'var(--wb-color-surface)',
    })
  })

  it('uses an explicit high-contrast selected state for favorite chips', () => {
    expect(getWardrobeChipStyle(true, 'favorite')).toMatchObject({
      minHeight: '32px',
      borderRadius: '999px',
      backgroundColor: 'var(--wb-color-accent)',
      color: 'var(--wb-color-accent-text)',
      border: '1px solid var(--wb-color-accent)',
    })
  })

  it('keeps the primary wardrobe action compact without losing button clarity', () => {
    expect(getWardrobeCompactActionStyle()).toMatchObject({
      minHeight: '38px',
      padding: '0 12px',
      borderRadius: '12px',
    })
  })
})
