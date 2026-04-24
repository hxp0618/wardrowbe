import { useAuthStore, type AppLocale } from '../stores/auth'

const messages = {
  zh: {
    nav_dashboard: '首页',
    nav_wardrobe: '衣橱',
    nav_suggest: '推荐',
    nav_outfits: '穿搭',
    nav_pairings: '配对',
    nav_history: '历史',
    nav_family_feed: '家庭动态',
    nav_analytics: '分析',
    nav_learning: '学习',
    nav_family: '家庭',
    nav_notifications: '通知',
    nav_settings: '设置',
    drawer_title: '导航',
    drawer_section_settings: '设置与协作',
  },
  en: {
    nav_dashboard: 'Home',
    nav_wardrobe: 'Wardrobe',
    nav_suggest: 'Suggest',
    nav_outfits: 'Outfits',
    nav_pairings: 'Pairings',
    nav_history: 'History',
    nav_family_feed: 'Family Feed',
    nav_analytics: 'Analytics',
    nav_learning: 'Learning',
    nav_family: 'Family',
    nav_notifications: 'Notifications',
    nav_settings: 'Settings',
    drawer_title: 'Navigation',
    drawer_section_settings: 'Settings & Family',
  },
} as const

type MessageKey = keyof typeof messages.zh

export function translate(locale: AppLocale, key: MessageKey): string {
  return messages[locale][key] ?? messages.zh[key]
}

export function useI18n() {
  const locale = useAuthStore((state) => state.locale)

  return {
    locale,
    t: (key: MessageKey) => translate(locale, key),
  }
}
