import { describe, expect, it } from 'vitest'

import { getWardrobeChipStyle, getWardrobeCompactActionStyle } from './controls-style'
import { getWardrobeUploadedItemStyle } from './look-and-feel'

describe('wardrobe look and feel', () => {
  it('highlights uploaded items without adding card elevation', () => {
    const style = getWardrobeUploadedItemStyle(true)

    expect(style.backgroundColor).toBeDefined()
    expect(style.border).toBeDefined()
    expect(style.boxShadow).toBeUndefined()
  })

  it('keeps wardrobe filters compact but finger-sized', () => {
    expect(getWardrobeChipStyle(false).minHeight).toBe('44px')
    expect(getWardrobeChipStyle(true).minHeight).toBe('44px')
    expect(getWardrobeChipStyle(true, 'warning').minHeight).toBe('44px')
    expect(getWardrobeCompactActionStyle().minHeight).toBe('44px')
  })
})
