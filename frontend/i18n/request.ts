import {getRequestConfig} from 'next-intl/server';
import {messages, type SupportedLocale} from '@wardrowbe/shared-i18n';

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return Object.prototype.hasOwnProperty.call(messages, locale);
}

function getFallbackLocale(): SupportedLocale {
  if (isSupportedLocale('zh')) {
    return 'zh';
  }

  for (const locale of Object.keys(messages)) {
    if (isSupportedLocale(locale)) {
      return locale;
    }
  }

  throw new Error('No shared i18n locales configured');
}

export default getRequestConfig(async ({requestLocale}) => {
  const requestedLocale = await requestLocale;
  const locale: SupportedLocale =
    requestedLocale && isSupportedLocale(requestedLocale)
      ? requestedLocale
      : getFallbackLocale();

  return {
    locale,
    messages: messages[locale],
  };
});
