import {defineRouting} from 'next-intl/routing';
import {defaultLocale, supportedLocales} from '@wardrowbe/shared-i18n';

export const routing = defineRouting({
  locales: supportedLocales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export type Locale = (typeof supportedLocales)[number];
