import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-intl/server', () => ({
  getRequestConfig: (factory: unknown) => factory,
}))

vi.mock('@wardrowbe/shared-i18n', () => ({
  messages: {
    en: {
      __source: 'shared-en',
    },
    zh: {
      __source: 'shared-zh',
    },
  },
}))

describe('request i18n config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('reads locale messages from the shared i18n package', async () => {
    const { default: getRequestConfig } = await import('../i18n/request')

    const config = await getRequestConfig({
      requestLocale: Promise.resolve('en'),
    })

    expect(config).toMatchObject({
      locale: 'en',
      messages: {
        __source: 'shared-en',
      },
    })
  })
})
