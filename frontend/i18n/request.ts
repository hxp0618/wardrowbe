import {getRequestConfig} from 'next-intl/server';
import {messages, type SupportedLocale} from '@wardrowbe/shared-i18n';
import {routing} from './routing';

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return routing.locales.includes(locale as SupportedLocale);
}

export default getRequestConfig(async ({requestLocale}) => {
  const requestedLocale = await requestLocale;
  const locale: SupportedLocale =
    requestedLocale && isSupportedLocale(requestedLocale)
      ? requestedLocale
      : (routing.defaultLocale as SupportedLocale);

  return {
    locale,
    messages: messages[locale],
  };
});
