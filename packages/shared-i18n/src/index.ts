import en from "../locale/en.json";
import zh from "../locale/zh.json";

export type Messages = typeof en;

export const messagesEn: Messages = en;
export const messagesZh: Messages = zh;

export const sharedLocales = {
  en: messagesEn,
  zh: messagesZh,
} as const;

export type SharedLocale = keyof typeof sharedLocales;
