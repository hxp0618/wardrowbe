import { describe, expect, it } from 'vitest'

import { getClothingSubtypeLabel } from '@/lib/taxonomy-i18n'

const enLabels: Record<string, string> = {
  'subtypes.track_jacket': 'Track Jacket',
  'subtypes.crewneck': 'Crewneck',
  'subtypes.oxford': 'Oxford',
}

const zhLabels: Record<string, string> = {
  'subtypes.track_jacket': '运动夹克',
  'subtypes.crewneck': '圆领',
  'subtypes.oxford': '牛津纺',
}

describe('getClothingSubtypeLabel', () => {
  it('localizes canonical subtype slugs with the active locale', () => {
    expect(getClothingSubtypeLabel('track-jacket', (key) => enLabels[key] ?? key)).toBe('Track Jacket')
    expect(getClothingSubtypeLabel('crewneck', (key) => zhLabels[key] ?? key)).toBe('圆领')
  })

  it('tolerates stored Chinese subtype values and re-localizes them through taxonomy keys', () => {
    expect(getClothingSubtypeLabel('牛津纺', (key) => enLabels[key] ?? key)).toBe('Oxford')
    expect(getClothingSubtypeLabel('牛津纺', (key) => zhLabels[key] ?? key)).toBe('牛津纺')
  })

  it('falls back to the original value for unknown labels', () => {
    expect(getClothingSubtypeLabel('unknown-shape', (key) => enLabels[key] ?? key)).toBe('unknown-shape')
  })
})
