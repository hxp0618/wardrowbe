import { describe, expect, it } from 'vitest'

import {
  OCCASION_VALUES,
  OUTFIT_STATUS_VALUES,
  ITEM_TYPE_VALUES,
  TEMPERATURE_UNIT_VALUES,
  WARDROBE_COLOR_OPTIONS,
  WEATHER_CONDITION_VALUES,
  buildOccasionOptions,
  getWardrobeColorHex,
  isLightWardrobeColor,
} from './options'

describe('shared option values', () => {
  it('centralizes stable selector values used across pages and sheets', () => {
    expect(OCCASION_VALUES).toEqual(['casual', 'office', 'formal', 'date', 'sporty', 'outdoor'])
    expect(OUTFIT_STATUS_VALUES).toEqual(['pending', 'accepted', 'rejected', 'viewed'])
    expect(ITEM_TYPE_VALUES).toEqual([
      't-shirt',
      'shirt',
      'pants',
      'jeans',
      'skirt',
      'dress',
      'jacket',
      'coat',
      'sneakers',
      'shoes',
    ])
    expect(TEMPERATURE_UNIT_VALUES).toEqual(['celsius', 'fahrenheit'])
    expect(WEATHER_CONDITION_VALUES).toEqual(['sunny', 'cloudy', 'rainy'])
  })

  it('centralizes wardrobe color swatches for pickers and charts', () => {
    expect(WARDROBE_COLOR_OPTIONS[0]).toEqual({ value: 'black', hex: '#171717' })
    expect(getWardrobeColorHex('navy')).toBe('#1e3a8a')
    expect(getWardrobeColorHex('unknown')).toBeUndefined()
    expect(isLightWardrobeColor('white')).toBe(true)
    expect(isLightWardrobeColor('black')).toBe(false)
  })

  it('builds localized occasion options from the shared values', () => {
    expect(buildOccasionOptions((value) => `label:${value}`)).toEqual([
      { label: 'label:casual', value: 'casual' },
      { label: 'label:office', value: 'office' },
      { label: 'label:formal', value: 'formal' },
      { label: 'label:date', value: 'date' },
      { label: 'label:sporty', value: 'sporty' },
      { label: 'label:outdoor', value: 'outdoor' },
    ])
  })
})
