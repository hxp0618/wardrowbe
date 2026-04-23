const ITEM_TYPE_LABELS: Record<string, string> = {
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

const SUBTYPE_LABELS: Record<string, string> = {
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

const COLOR_LABELS: Record<string, string> = {
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

const STYLE_LABELS: Record<string, string> = {
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

const OCCASION_LABELS: Record<string, string> = {
  casual: '休闲',
  office: '办公',
  work: '通勤',
  formal: '正式',
  date: '约会',
  sporty: '运动',
  outdoor: '户外',
  party: '聚会',
}

const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  member: '成员',
}

const CHANNEL_LABELS: Record<string, string> = {
  email: '邮箱',
  webhook: 'Webhook',
  ntfy: 'ntfy',
  mattermost: 'Mattermost',
  bark: 'Bark',
  expo_push: 'Expo Push',
}

const WEATHER_CONDITION_LABELS: Record<string, string> = {
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

export function formatItemTypeLabel(type: string | null | undefined): string {
  if (!type) return ''
  const normalized = normalizeKey(type)
  return ITEM_TYPE_LABELS[normalized] ?? humanizeToken(type)
}

export function formatSubtypeLabel(subtype: string | null | undefined): string {
  if (!subtype) return ''
  const normalized = hasChinese(subtype) ? SUBTYPE_VALUE_BY_ZH[subtype] : normalizeKey(subtype)
  return (normalized && SUBTYPE_LABELS[normalized]) ?? humanizeToken(subtype)
}

export function formatColorLabel(color: string | null | undefined): string {
  if (!color) return ''
  return COLOR_LABELS[normalizeKey(color)] ?? humanizeToken(color)
}

export function formatStyleLabel(style: string | null | undefined): string {
  if (!style) return ''
  return STYLE_LABELS[normalizeKey(style)] ?? humanizeToken(style)
}

export function formatOccasionLabel(occasion: string | null | undefined): string {
  if (!occasion) return ''
  return OCCASION_LABELS[normalizeKey(occasion)] ?? humanizeToken(occasion)
}

export function formatRoleLabel(role: string | null | undefined): string {
  if (!role) return ''
  return ROLE_LABELS[normalizeKey(role)] ?? humanizeToken(role)
}

export function formatNotificationChannelLabel(channel: string | null | undefined): string {
  if (!channel) return ''
  return CHANNEL_LABELS[normalizeKey(channel)] ?? humanizeToken(channel)
}

export function formatWeatherConditionLabel(condition: string | null | undefined): string {
  if (!condition) return ''
  const normalized = condition.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return WEATHER_CONDITION_LABELS[normalized] ?? humanizeToken(condition)
}
