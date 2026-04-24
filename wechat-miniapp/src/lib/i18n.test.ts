import { describe, expect, it } from 'vitest'

import { formatGreeting, translate } from './i18n'

describe('i18n helpers', () => {
  it('translates page shell copy keys for both locales', () => {
    expect(translate('zh', 'page_wardrobe_title')).toBe('衣橱')
    expect(translate('en', 'page_wardrobe_title')).toBe('Wardrobe')
    expect(translate('zh', 'page_notifications_subtitle')).toBe(
      '管理通知渠道和提醒计划'
    )
    expect(translate('en', 'page_notifications_subtitle')).toBe(
      'Manage channels and reminder schedules'
    )
  })

  it('formats dashboard greetings with locale-aware templates', () => {
    expect(formatGreeting('zh', 'Ada Lovelace')).toBe('你好，Ada')
    expect(formatGreeting('en', 'Ada Lovelace')).toBe('Hello, Ada')
    expect(formatGreeting('zh')).toBe('你好')
    expect(formatGreeting('en')).toBe('Hello')
  })
})
