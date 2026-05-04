import { describe, expect, it } from 'vitest'

import {
  getEditorialCardStyle,
  getEditorialChipStyle,
  getEditorialCompactButtonStyle,
  getEditorialFeatureCardStyle,
  getEditorialMetricTileStyle,
  getEditorialPickerTriggerStyle,
  getEditorialRaisedPanelStyle,
  getEditorialTintedPanelStyle,
} from './editorial-style'
import { cardRadius } from './ui-theme'

describe('editorial card surfaces', () => {
  it('keeps ordinary card surfaces visually compact with an 8px radius', () => {
    expect(cardRadius).toBe('8px')
    expect(getEditorialCardStyle().borderRadius).toBe('8px')
    expect(getEditorialRaisedPanelStyle().borderRadius).toBe('8px')
    expect(getEditorialTintedPanelStyle('sky').borderRadius).toBe('8px')
    expect(getEditorialTintedPanelStyle('sage').borderRadius).toBe('8px')
    expect(getEditorialTintedPanelStyle('rose').borderRadius).toBe('8px')
    expect(getEditorialMetricTileStyle('sand').borderRadius).toBe('8px')
    expect(getEditorialMetricTileStyle('sky').borderRadius).toBe('8px')
    expect(getEditorialMetricTileStyle('sage').borderRadius).toBe('8px')
    expect(getEditorialCardStyle().boxShadow).toBeUndefined()
    expect(getEditorialRaisedPanelStyle().boxShadow).toBeUndefined()
    expect(getEditorialFeatureCardStyle().boxShadow).toBeUndefined()
  })

  it('keeps compact interactive controls large enough for touch', () => {
    expect(getEditorialPickerTriggerStyle().minHeight).toBe('44px')
    expect(getEditorialChipStyle(false).minHeight).toBe('44px')
    expect(getEditorialChipStyle(true).minHeight).toBe('44px')
    expect(getEditorialChipStyle(true, 'warning').minHeight).toBe('44px')
    expect(getEditorialCompactButtonStyle().minHeight).toBe('44px')
  })
})
