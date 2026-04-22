import {getRequestConfig} from 'next-intl/server';
import {
  defaultLocale,
  messages,
  supportedLocales,
  type SupportedLocale,
} from '@wardrowbe/shared-i18n';

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return supportedLocales.some((supportedLocale) => supportedLocale === locale);
}

export default getRequestConfig(async ({requestLocale}) => {
  const requestedLocale = await requestLocale;
  const locale: SupportedLocale =
    requestedLocale && isSupportedLocale(requestedLocale)
      ? requestedLocale
      : defaultLocale;

  return {
    locale,
    messages: messages[locale],
  };
});
