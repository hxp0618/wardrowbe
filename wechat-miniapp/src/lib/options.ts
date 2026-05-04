export const OCCASION_VALUES = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor'] as const
export const OUTFIT_STATUS_VALUES = ['pending', 'accepted', 'rejected', 'viewed'] as const
export const ITEM_TYPE_VALUES = [
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
] as const
export const TEMPERATURE_UNIT_VALUES = ['celsius', 'fahrenheit'] as const
export const WEATHER_CONDITION_VALUES = ['sunny', 'cloudy', 'rainy'] as const
export const WARDROBE_COLOR_OPTIONS = [
  { value: 'black', hex: '#171717' },
  { value: 'white', hex: '#f5f5f5' },
  { value: 'gray', hex: '#9ca3af' },
  { value: 'navy', hex: '#1e3a8a' },
  { value: 'blue', hex: '#2563eb' },
  { value: 'green', hex: '#15803d' },
  { value: 'red', hex: '#dc2626' },
  { value: 'pink', hex: '#ec4899' },
  { value: 'purple', hex: '#7c3aed' },
  { value: 'yellow', hex: '#facc15' },
  { value: 'orange', hex: '#f97316' },
  { value: 'brown', hex: '#92400e' },
  { value: 'beige', hex: '#d6c6a5' },
] as const

export type OccasionValue = (typeof OCCASION_VALUES)[number]
export type OutfitStatusValue = (typeof OUTFIT_STATUS_VALUES)[number]
export type ItemTypeValue = (typeof ITEM_TYPE_VALUES)[number]
export type TemperatureUnitValue = (typeof TEMPERATURE_UNIT_VALUES)[number]
export type WardrobeColorValue = (typeof WARDROBE_COLOR_OPTIONS)[number]['value']
export type WeatherConditionValue = (typeof WEATHER_CONDITION_VALUES)[number]

export function buildOccasionOptions(formatLabel: (value: OccasionValue) => string) {
  return OCCASION_VALUES.map((value) => ({
    label: formatLabel(value),
    value,
  }))
}

export function getWardrobeColorHex(value: string): string | undefined {
  return WARDROBE_COLOR_OPTIONS.find((option) => option.value === value)?.hex
}

export function isLightWardrobeColor(value: string): boolean {
  return value === 'white' || value === 'yellow' || value === 'beige'
}
