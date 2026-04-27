import type { AppLocale } from '../stores/auth'

const ITEM_TYPE_LABELS_ZH: Record<string, string> = {
  tops: '上装',
  bottoms: '下装',
  outerwear: '外套',
  shoes: '鞋履',
  accessories: '配饰',
  dresses: '连衣裙',
  activewear: '运动',
  't-shirt': 'T 恤',
  top: '上衣',
  polo: 'Polo 衫',
  blouse: '女式衬衫',
  'tank-top': '背心',
  sweater: '毛衣',
  hoodie: '连帽衫',
  cardigan: '开衫',
  vest: '马甲',
  pants: '长裤',
  jeans: '牛仔裤',
  shorts: '短裤',
  skirt: '半身裙',
  dress: '连衣裙',
  jumpsuit: '连体裤',
  jacket: '夹克',
  blazer: '西装外套',
  coat: '大衣',
  suit: '套装',
  sneakers: '运动鞋',
  boots: '靴子',
  sandals: '凉鞋',
  socks: '袜子',
  tie: '领带',
  hat: '帽子',
  scarf: '围巾',
  belt: '腰带',
  bag: '包',
}

const ITEM_TYPE_LABELS_EN: Record<string, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessories: 'Accessories',
  dresses: 'Dresses',
  activewear: 'Activewear',
  't-shirt': 'T-Shirt',
  top: 'Top',
  polo: 'Polo Shirt',
  blouse: 'Blouse',
  'tank-top': 'Tank Top',
  sweater: 'Sweater',
  hoodie: 'Hoodie',
  cardigan: 'Cardigan',
  vest: 'Vest',
  pants: 'Pants',
  jeans: 'Jeans',
  shorts: 'Shorts',
  skirt: 'Skirt',
  dress: 'Dress',
  jumpsuit: 'Jumpsuit',
  jacket: 'Jacket',
  blazer: 'Blazer',
  coat: 'Coat',
  suit: 'Suit',
  sneakers: 'Sneakers',
  boots: 'Boots',
  sandals: 'Sandals',
  socks: 'Socks',
  tie: 'Tie',
  hat: 'Hat',
  scarf: 'Scarf',
  belt: 'Belt',
  bag: 'Bag',
}

const SUBTYPE_LABELS_ZH: Record<string, string> = {
  henley: '亨利领',
  'button-down': '扣领衬衫',
  oxford: '牛津纺',
  flannel: '法兰绒',
  hawaiian: '夏威夷衬衫',
  'camp-collar': '古巴领',
  'track-jacket': '运动夹克',
  'denim-jacket': '牛仔夹克',
  bomber: '飞行员夹克',
  parka: '派克大衣',
  windbreaker: '防风夹克',
  trucker: '工装夹克',
  anorak: '套头防风外套',
  chinos: '斜纹裤',
  joggers: '束脚裤',
  cargo: '工装裤',
  trousers: '西裤',
  leggings: '紧身裤',
  sweatpants: '卫裤',
  sundress: '夏日连衣裙',
  'slip-dress': '吊带裙',
  maxi: '长款',
  midi: '中长款',
  wrap: '裹身式',
  'shirt-dress': '衬衫裙',
  'a-line': 'A 字款',
  loafers: '乐福鞋',
  oxfords: '牛津鞋',
  mules: '穆勒鞋',
  flats: '平底鞋',
  heels: '高跟鞋',
  platforms: '厚底鞋',
  'low-top': '低帮',
  'high-top': '高帮',
  chunky: '厚底',
  'slip-on': '一脚蹬',
  ankle: '短款',
  chelsea: '切尔西靴',
  combat: '工装靴',
  'knee-high': '高筒',
  rain: '雨靴',
  pleated: '百褶',
  pencil: '铅笔裙',
  pullover: '套头',
  crewneck: '圆领',
  turtleneck: '高领',
  'v-neck': 'V 领',
  necktie: '领带',
  'bow-tie': '领结',
  bolo: '波洛领带',
}

const SUBTYPE_LABELS_EN: Record<string, string> = {
  henley: 'Henley',
  'button-down': 'Button-Down',
  oxford: 'Oxford',
  flannel: 'Flannel',
  hawaiian: 'Hawaiian Shirt',
  'camp-collar': 'Camp Collar',
  'track-jacket': 'Track Jacket',
  'denim-jacket': 'Denim Jacket',
  bomber: 'Bomber Jacket',
  parka: 'Parka',
  windbreaker: 'Windbreaker',
  trucker: 'Trucker Jacket',
  anorak: 'Anorak',
  chinos: 'Chinos',
  joggers: 'Joggers',
  cargo: 'Cargo Pants',
  trousers: 'Trousers',
  leggings: 'Leggings',
  sweatpants: 'Sweatpants',
  sundress: 'Sundress',
  'slip-dress': 'Slip Dress',
  maxi: 'Maxi',
  midi: 'Midi',
  wrap: 'Wrap',
  'shirt-dress': 'Shirt Dress',
  'a-line': 'A-Line',
  loafers: 'Loafers',
  oxfords: 'Oxfords',
  mules: 'Mules',
  flats: 'Flats',
  heels: 'Heels',
  platforms: 'Platforms',
  'low-top': 'Low Top',
  'high-top': 'High Top',
  chunky: 'Chunky',
  'slip-on': 'Slip-On',
  ankle: 'Ankle',
  chelsea: 'Chelsea',
  combat: 'Combat',
  'knee-high': 'Knee High',
  rain: 'Rain',
  pleated: 'Pleated',
  pencil: 'Pencil',
  pullover: 'Pullover',
  crewneck: 'Crewneck',
  turtleneck: 'Turtleneck',
  'v-neck': 'V-Neck',
  necktie: 'Necktie',
  'bow-tie': 'Bow Tie',
  bolo: 'Bolo',
}

const SUBTYPE_VALUE_BY_ZH: Record<string, string> = {
  亨利领: 'henley',
  扣领衬衫: 'button-down',
  牛津纺: 'oxford',
  法兰绒: 'flannel',
  夏威夷衬衫: 'hawaiian',
  古巴领: 'camp-collar',
  运动夹克: 'track-jacket',
  牛仔夹克: 'denim-jacket',
  飞行员夹克: 'bomber',
  派克大衣: 'parka',
  防风夹克: 'windbreaker',
  工装夹克: 'trucker',
  套头防风外套: 'anorak',
  斜纹裤: 'chinos',
  束脚裤: 'joggers',
  工装裤: 'cargo',
  西裤: 'trousers',
  紧身裤: 'leggings',
  卫裤: 'sweatpants',
  夏日连衣裙: 'sundress',
  吊带裙: 'slip-dress',
  长款: 'maxi',
  中长款: 'midi',
  裹身式: 'wrap',
  衬衫裙: 'shirt-dress',
  'A字款': 'a-line',
  乐福鞋: 'loafers',
  牛津鞋: 'oxfords',
  穆勒鞋: 'mules',
  平底鞋: 'flats',
  高跟鞋: 'heels',
  厚底鞋: 'platforms',
  低帮: 'low-top',
  高帮: 'high-top',
  厚底: 'chunky',
  一脚蹬: 'slip-on',
  短款: 'ankle',
  切尔西靴: 'chelsea',
  工装靴: 'combat',
  高筒: 'knee-high',
  雨靴: 'rain',
  百褶: 'pleated',
  铅笔裙: 'pencil',
  套头: 'pullover',
  圆领: 'crewneck',
  高领: 'turtleneck',
  'V领': 'v-neck',
  领带: 'necktie',
  领结: 'bow-tie',
  波洛领带: 'bolo',
}

const COLOR_LABELS_ZH: Record<string, string> = {
  black: '黑色',
  white: '白色',
  gray: '灰色',
  grey: '灰色',
  navy: '海军蓝',
  blue: '蓝色',
  green: '绿色',
  red: '红色',
  pink: '粉色',
  purple: '紫色',
  yellow: '黄色',
  orange: '橙色',
  brown: '棕色',
  beige: '米色',
  khaki: '卡其色',
  olive: '橄榄绿',
  cream: '奶油色',
}

const COLOR_LABELS_EN: Record<string, string> = {
  black: 'Black',
  white: 'White',
  gray: 'Gray',
  grey: 'Gray',
  navy: 'Navy',
  blue: 'Blue',
  green: 'Green',
  red: 'Red',
  pink: 'Pink',
  purple: 'Purple',
  yellow: 'Yellow',
  orange: 'Orange',
  brown: 'Brown',
  beige: 'Beige',
  khaki: 'Khaki',
  olive: 'Olive',
  cream: 'Cream',
}

const STYLE_LABELS_ZH: Record<string, string> = {
  minimalist: '极简',
  casual: '休闲',
  classic: '经典',
  elegant: '优雅',
  sporty: '运动',
  streetwear: '街头',
  modern: '现代',
  vintage: '复古',
  chic: '时髦',
  edgy: '个性',
  preppy: '学院',
  boho: '波西米亚',
  romantic: '浪漫',
}

const STYLE_LABELS_EN: Record<string, string> = {
  minimalist: 'Minimalist',
  casual: 'Casual',
  classic: 'Classic',
  elegant: 'Elegant',
  sporty: 'Sporty',
  streetwear: 'Streetwear',
  modern: 'Modern',
  vintage: 'Vintage',
  chic: 'Chic',
  edgy: 'Edgy',
  preppy: 'Preppy',
  boho: 'Boho',
  romantic: 'Romantic',
}

const OCCASION_LABELS_ZH: Record<string, string> = {
  casual: '休闲',
  office: '办公',
  work: '通勤',
  formal: '正式',
  date: '约会',
  sporty: '运动',
  outdoor: '户外',
  party: '聚会',
}

const OCCASION_LABELS_EN: Record<string, string> = {
  casual: 'Casual',
  office: 'Office',
  work: 'Work',
  formal: 'Formal',
  date: 'Date',
  sporty: 'Sporty',
  outdoor: 'Outdoor',
  party: 'Party',
}

const ROLE_LABELS_ZH: Record<string, string> = {
  admin: '管理员',
  member: '成员',
}

const ROLE_LABELS_EN: Record<string, string> = {
  admin: 'Admin',
  member: 'Member',
}

const CHANNEL_LABELS_ZH: Record<string, string> = {
  email: '邮箱',
  webhook: 'Webhook',
  ntfy: 'ntfy',
  mattermost: 'Mattermost',
  bark: 'Bark',
  expo_push: 'Expo Push',
}

const CHANNEL_LABELS_EN: Record<string, string> = {
  email: 'Email',
  webhook: 'Webhook',
  ntfy: 'ntfy',
  mattermost: 'Mattermost',
  bark: 'Bark',
  expo_push: 'Expo Push',
  wechat_work: 'WeCom',
}

const WEATHER_CONDITION_LABELS_ZH: Record<string, string> = {
  clear: '晴朗',
  sunny: '晴天',
  clouds: '多云',
  cloudy: '阴天',
  overcast: '阴',
  partly_cloudy: '局部多云',
  rain: '雨',
  drizzle: '小雨',
  thunderstorm: '雷暴',
  snow: '雪',
  fog: '雾',
  mist: '薄雾',
  haze: '霾',
  windy: '大风',
}

const WEATHER_CONDITION_LABELS_EN: Record<string, string> = {
  clear: 'Clear',
  sunny: 'Sunny',
  clouds: 'Cloudy',
  cloudy: 'Cloudy',
  overcast: 'Overcast',
  partly_cloudy: 'Partly Cloudy',
  rain: 'Rain',
  drizzle: 'Drizzle',
  thunderstorm: 'Thunderstorm',
  snow: 'Snow',
  fog: 'Fog',
  mist: 'Mist',
  haze: 'Haze',
  windy: 'Windy',
}

const OUTFIT_STATUS_LABELS_ZH: Record<string, string> = {
  pending: '待确认',
  accepted: '已接受',
  rejected: '已拒绝',
  viewed: '已查看',
  expired: '已过期',
}

const OUTFIT_STATUS_LABELS_EN: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  viewed: 'Viewed',
  expired: 'Expired',
}

const OUTFIT_SOURCE_LABELS_ZH: Record<string, string> = {
  scheduled: '定时推荐',
  on_demand: 'AI 推荐',
  manual: '手动创建',
  pairing: '搭配推荐',
}

const OUTFIT_SOURCE_LABELS_EN: Record<string, string> = {
  scheduled: 'Scheduled',
  on_demand: 'AI Suggestion',
  manual: 'Manual',
  pairing: 'Pairing',
}

function hasChinese(value: string): boolean {
  return /[\u4e00-\u9fff]/.test(value)
}

function humanizeToken(value: string): string {
  if (!value) return value
  if (hasChinese(value)) return value

  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-')
}

function labelsFor(_locale?: AppLocale) {
  return {
    itemTypes: ITEM_TYPE_LABELS_ZH,
    subtypes: SUBTYPE_LABELS_ZH,
    colors: COLOR_LABELS_ZH,
    styles: STYLE_LABELS_ZH,
    occasions: OCCASION_LABELS_ZH,
    roles: ROLE_LABELS_ZH,
    channels: CHANNEL_LABELS_ZH,
    weather: WEATHER_CONDITION_LABELS_ZH,
    outfitStatuses: OUTFIT_STATUS_LABELS_ZH,
    outfitSources: OUTFIT_SOURCE_LABELS_ZH,
  }
}

export function formatItemTypeLabel(type: string | null | undefined, locale?: AppLocale): string {
  if (!type) return ''
  const normalized = normalizeKey(type)
  return labelsFor(locale).itemTypes[normalized] ?? humanizeToken(type)
}

export function formatSubtypeLabel(subtype: string | null | undefined, locale?: AppLocale): string {
  if (!subtype) return ''
  const normalized = hasChinese(subtype) ? SUBTYPE_VALUE_BY_ZH[subtype] : normalizeKey(subtype)
  return (normalized && labelsFor(locale).subtypes[normalized]) ?? humanizeToken(subtype)
}

export function formatColorLabel(color: string | null | undefined, locale?: AppLocale): string {
  if (!color) return ''
  return labelsFor(locale).colors[normalizeKey(color)] ?? humanizeToken(color)
}

export function formatStyleLabel(style: string | null | undefined, locale?: AppLocale): string {
  if (!style) return ''
  return labelsFor(locale).styles[normalizeKey(style)] ?? humanizeToken(style)
}

export function formatOccasionLabel(occasion: string | null | undefined, locale?: AppLocale): string {
  if (!occasion) return ''
  return labelsFor(locale).occasions[normalizeKey(occasion)] ?? humanizeToken(occasion)
}

export function formatRoleLabel(role: string | null | undefined, locale?: AppLocale): string {
  if (!role) return ''
  return labelsFor(locale).roles[normalizeKey(role)] ?? humanizeToken(role)
}

export function formatNotificationChannelLabel(channel: string | null | undefined, locale?: AppLocale): string {
  if (!channel) return ''
  return labelsFor(locale).channels[normalizeKey(channel)] ?? humanizeToken(channel)
}

export function formatWeatherConditionLabel(condition: string | null | undefined, locale?: AppLocale): string {
  if (!condition) return ''
  const normalized = condition.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return labelsFor(locale).weather[normalized] ?? humanizeToken(condition)
}

export function formatOutfitStatusLabel(status: string | null | undefined, locale?: AppLocale): string {
  if (!status) return ''
  return labelsFor(locale).outfitStatuses[normalizeKey(status)] ?? humanizeToken(status)
}

export function formatOutfitSourceLabel(source: string | null | undefined, locale?: AppLocale): string {
  if (!source) return ''
  const normalized = source.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return labelsFor(locale).outfitSources[normalized] ?? humanizeToken(source)
}
