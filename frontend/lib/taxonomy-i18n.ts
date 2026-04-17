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

const SUBTYPE_KEY_BY_VALUE: Record<string, string> = {
  'henley': 'henley',
  'button-down': 'button_down',
  'oxford': 'oxford',
  'flannel': 'flannel',
  'hawaiian': 'hawaiian',
  'camp-collar': 'camp_collar',
  'track-jacket': 'track_jacket',
  'denim-jacket': 'denim_jacket',
  'bomber': 'bomber',
  'parka': 'parka',
  'windbreaker': 'windbreaker',
  'trucker': 'trucker',
  'anorak': 'anorak',
  'chinos': 'chinos',
  'joggers': 'joggers',
  'cargo': 'cargo',
  'trousers': 'trousers',
  'leggings': 'leggings',
  'sweatpants': 'sweatpants',
  'sundress': 'sundress',
  'slip-dress': 'slip_dress',
  'maxi': 'maxi',
  'midi': 'midi',
  'wrap': 'wrap',
  'shirt-dress': 'shirt_dress',
  'a-line': 'a_line',
  'loafers': 'loafers',
  'oxfords': 'oxfords',
  'mules': 'mules',
  'flats': 'flats',
  'heels': 'heels',
  'platforms': 'platforms',
  'low-top': 'low_top',
  'high-top': 'high_top',
  'chunky': 'chunky',
  'slip-on': 'slip_on',
  'ankle': 'ankle',
  'chelsea': 'chelsea',
  'combat': 'combat',
  'knee-high': 'knee_high',
  'rain': 'rain',
  'mini': 'mini',
  'pleated': 'pleated',
  'pencil': 'pencil',
  'pullover': 'pullover',
  'crewneck': 'crewneck',
  'turtleneck': 'turtleneck',
  'v-neck': 'v_neck',
  'necktie': 'necktie',
  'bow-tie': 'bow_tie',
  'bolo': 'bolo',
}

const SUBTYPE_VALUE_BY_ZH: Record<string, string> = {
  '亨利领': 'henley',
  '扣领衬衫': 'button-down',
  '牛津纺': 'oxford',
  '法兰绒': 'flannel',
  '夏威夷衬衫': 'hawaiian',
  '古巴领': 'camp-collar',
  '运动夹克': 'track-jacket',
  '牛仔夹克': 'denim-jacket',
  '飞行员夹克': 'bomber',
  '派克大衣': 'parka',
  '防风夹克': 'windbreaker',
  '工装夹克': 'trucker',
  '套头防风外套': 'anorak',
  '斜纹裤': 'chinos',
  '束脚裤': 'joggers',
  '工装裤': 'cargo',
  '西裤': 'trousers',
  '紧身裤': 'leggings',
  '卫裤': 'sweatpants',
  '夏日连衣裙': 'sundress',
  '吊带裙': 'slip-dress',
  '长款': 'maxi',
  '中长款': 'midi',
  '裹身式': 'wrap',
  '衬衫裙': 'shirt-dress',
  'A字款': 'a-line',
  '乐福鞋': 'loafers',
  '牛津鞋': 'oxfords',
  '穆勒鞋': 'mules',
  '平底鞋': 'flats',
  '高跟鞋': 'heels',
  '厚底鞋': 'platforms',
  '低帮': 'low-top',
  '高帮': 'high-top',
  '厚底': 'chunky',
  '一脚蹬': 'slip-on',
  '短款': 'ankle',
  '切尔西靴': 'chelsea',
  '工装靴': 'combat',
  '高筒': 'knee-high',
  '雨靴': 'rain',
  '百褶': 'pleated',
  '铅笔裙': 'pencil',
  '套头': 'pullover',
  '圆领': 'crewneck',
  '高领': 'turtleneck',
  'V领': 'v-neck',
  '领带': 'necktie',
  '领结': 'bow-tie',
  '波洛领带': 'bolo',
}

/** Localized clothing type; unknown API values are returned as-is. */
export function getClothingTypeLabel(type: string, tt: TaxonomyTranslate): string {
  const opt = CLOTHING_TYPES.find((x) => x.value === type);
  if (!opt) return type;
  return tt(`types.${opt.value}`);
}

/** Localized clothing subtype; accepts canonical API value and tolerates stored Chinese labels. */
export function getClothingSubtypeLabel(subtype: string, tt: TaxonomyTranslate): string {
  if (!subtype) return subtype;
  const canonical = /[\u4e00-\u9fff]/.test(subtype)
    ? SUBTYPE_VALUE_BY_ZH[subtype]
    : subtype.trim().toLowerCase().replace(/[\s_]+/g, '-');
  const key = canonical ? SUBTYPE_KEY_BY_VALUE[canonical] : null;
  if (!key) return subtype;
  return tt(`subtypes.${key}`);
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
