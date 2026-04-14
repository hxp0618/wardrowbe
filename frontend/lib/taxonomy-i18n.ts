import { CLOTHING_COLORS, CLOTHING_TYPES, OCCASIONS } from '@/lib/types';

/** Keys under suggest.weatherConditions — unknown API strings pass through */
const WEATHER_CONDITION_KEYS = new Set([
  'clear',
  'sunny',
  'clouds',
  'cloudy',
  'overcast',
  'partly_cloudy',
  'rain',
  'drizzle',
  'thunderstorm',
  'snow',
  'fog',
  'mist',
  'haze',
  'windy',
]);

/** Maps API color values to keys under taxonomy.colors (hyphens → underscores). */
export function taxonomyColorKey(value: string): string {
  return value.replace(/-/g, '_');
}

type TaxonomyTranslate = (key: string) => string;

/** Localized clothing type; unknown API values are returned as-is. */
export function getClothingTypeLabel(type: string, tt: TaxonomyTranslate): string {
  const opt = CLOTHING_TYPES.find((x) => x.value === type);
  if (!opt) return type;
  return tt(`types.${opt.value}`);
}

/** Localized palette color; unknown values are returned as-is. */
export function getClothingColorLabel(color: string, tt: TaxonomyTranslate): string {
  if (!CLOTHING_COLORS.some((c) => c.value === color)) return color;
  return tt(`colors.${taxonomyColorKey(color)}`);
}

/** Localized occasion (recommendations / outfits); unknown values as-is. */
export function getOccasionLabel(occasion: string, tt: TaxonomyTranslate): string {
  if (!OCCASIONS.some((o) => o.value === occasion)) return occasion;
  return tt(`occasions.${occasion}`);
}

function normalizeWeatherConditionKey(condition: string): string {
  return condition.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/** Localized weather API condition string when key exists under suggest.weatherConditions */
export function getWeatherConditionLabel(condition: string, tsuggest: TaxonomyTranslate): string {
  const key = normalizeWeatherConditionKey(condition);
  if (!WEATHER_CONDITION_KEYS.has(key)) return condition;
  return tsuggest(`weatherConditions.${key}`);
}
