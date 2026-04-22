import en from './en.json'
import zh from './zh.json'

export const supportedLocales = ['zh', 'en'] as const
export type SupportedLocale = (typeof supportedLocales)[number]

export const defaultLocale: SupportedLocale = 'zh'

export const messages = {
  zh,
  en,
} satisfies Record<SupportedLocale, typeof en>
