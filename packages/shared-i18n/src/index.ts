import en from './en.json'
import zh from './zh.json'

export const messages = { en, zh }
export type SupportedLocale = keyof typeof messages
