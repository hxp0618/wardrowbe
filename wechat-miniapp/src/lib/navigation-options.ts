export type NavLabelKey =
  | 'nav_dashboard'
  | 'nav_wardrobe'
  | 'nav_suggest'
  | 'nav_outfits'
  | 'nav_pairings'
  | 'nav_history'
  | 'nav_family_feed'
  | 'nav_analytics'
  | 'nav_learning'
  | 'nav_family'
  | 'nav_notifications'
  | 'nav_settings'

export type AppTabKey = 'dashboard' | 'wardrobe' | 'suggest' | 'outfits' | 'settings'

export type AppDrawerKey =
  | AppTabKey
  | 'pairings'
  | 'history'
  | 'family-feed'
  | 'analytics'
  | 'learning'
  | 'family'
  | 'notifications'

export type AppNavItem = {
  key: AppDrawerKey
  labelKey: NavLabelKey
  text: string
  url: string
  type: 'tab' | 'page'
  iconText?: string
  iconPath?: string
  selectedIconPath?: string
}

export type AppTabNavItem = AppNavItem & {
  key: AppTabKey
  type: 'tab'
  iconPath: string
  selectedIconPath: string
}

function tabIcon(name: string) {
  return `/assets/tabbar/${name}.png`
}

export const TAB_NAV_ITEMS: AppTabNavItem[] = [
  {
    key: 'dashboard',
    labelKey: 'nav_dashboard',
    text: '首页',
    url: '/pages/dashboard/index',
    type: 'tab',
    iconPath: tabIcon('home'),
    selectedIconPath: tabIcon('home-active'),
  },
  {
    key: 'wardrobe',
    labelKey: 'nav_wardrobe',
    text: '衣橱',
    url: '/pages/wardrobe/index',
    type: 'tab',
    iconPath: tabIcon('wardrobe'),
    selectedIconPath: tabIcon('wardrobe-active'),
  },
  {
    key: 'suggest',
    labelKey: 'nav_suggest',
    text: '推荐',
    url: '/pages/suggest/index',
    type: 'tab',
    iconPath: tabIcon('suggest'),
    selectedIconPath: tabIcon('suggest-active'),
  },
  {
    key: 'outfits',
    labelKey: 'nav_outfits',
    text: '穿搭',
    url: '/pages/outfits/index',
    type: 'tab',
    iconPath: tabIcon('outfits'),
    selectedIconPath: tabIcon('outfits-active'),
  },
  {
    key: 'settings',
    labelKey: 'nav_settings',
    text: '设置',
    url: '/pages/settings/index',
    type: 'tab',
    iconPath: tabIcon('settings'),
    selectedIconPath: tabIcon('settings-active'),
  },
]

export const PRIMARY_DRAWER_ITEMS: AppNavItem[] = [
  ...TAB_NAV_ITEMS.filter((item) => item.key !== 'settings'),
  { key: 'pairings', labelKey: 'nav_pairings', text: '配对', iconText: '◫', url: '/pages/pairings/index', type: 'page' },
  { key: 'history', labelKey: 'nav_history', text: '历史', iconText: '↺', url: '/pages/history/index', type: 'page' },
  { key: 'family-feed', labelKey: 'nav_family_feed', text: '家庭动态', iconText: '♡', url: '/pages/family-feed/index', type: 'page' },
  { key: 'analytics', labelKey: 'nav_analytics', text: '分析', iconText: '◔', url: '/pages/analytics/index', type: 'page' },
  { key: 'learning', labelKey: 'nav_learning', text: '学习', iconText: '◌', url: '/pages/learning/index', type: 'page' },
]

export const SECONDARY_DRAWER_ITEMS: AppNavItem[] = [
  { key: 'family', labelKey: 'nav_family', text: '家庭', iconText: '◍', url: '/pages/family/index', type: 'page' },
  { key: 'notifications', labelKey: 'nav_notifications', text: '通知', iconText: '◉', url: '/pages/notifications/index', type: 'page' },
  TAB_NAV_ITEMS.find((item) => item.key === 'settings')!,
]

export const ALL_DRAWER_ITEMS: AppNavItem[] = [
  ...PRIMARY_DRAWER_ITEMS,
  ...SECONDARY_DRAWER_ITEMS,
]

export function toMiniappPagePath(url: string) {
  return url.replace(/^\//, '')
}

export function toMiniappAssetPath(path: string) {
  return path.replace(/^\//, '')
}
