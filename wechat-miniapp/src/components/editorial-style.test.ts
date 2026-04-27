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

describe('editorial style helpers', () => {
  it('provides the brighter raised panel used by wardrobe, dashboard and suggest', () => {
    expect(getEditorialRaisedPanelStyle()).toMatchObject({
      backgroundColor: 'var(--wb-color-surface-raised)',
      borderRadius: '22px',
    })
  })

  it('keeps compact picker triggers aligned with the wardrobe control rhythm', () => {
    expect(getEditorialPickerTriggerStyle()).toMatchObject({
      minHeight: '40px',
      borderRadius: '12px',
      backgroundColor: 'var(--wb-color-surface)',
    })
  })

  it('uses a high-contrast selected chip state for editorial filters', () => {
    expect(getEditorialChipStyle(true)).toMatchObject({
      minHeight: '32px',
      backgroundColor: 'var(--wb-color-accent)',
      color: 'var(--wb-color-accent-text)',
    })
  })

  it('keeps compact buttons visually aligned with the refined wardrobe CTA', () => {
    expect(getEditorialCompactButtonStyle()).toMatchObject({
      minHeight: '38px',
      borderRadius: '12px',
      padding: '0 12px',
    })
  })

  it('uses a softer shell for editorial content cards', () => {
    expect(getEditorialCardStyle()).toMatchObject({
      backgroundColor: 'var(--wb-color-surface)',
      borderRadius: '22px',
      border: '1px solid rgba(9, 9, 11, 0.06)',
    })
  })

  it('provides a more visible feature card for hero sections', () => {
    expect(getEditorialFeatureCardStyle()).toMatchObject({
      borderRadius: '26px',
      backgroundColor: 'rgba(255, 249, 241, 0.96)',
    })
  })

  it('supports tinted panels so empty states and summaries do not all look identical', () => {
    expect(getEditorialTintedPanelStyle('sky')).toMatchObject({
      borderRadius: '20px',
    })
  })

  it('provides metric tiles so hero sections can surface stronger visual hierarchy', () => {
    expect(getEditorialMetricTileStyle('sage')).toMatchObject({
      borderRadius: '18px',
      padding: '12px 14px',
    })
  })
})
