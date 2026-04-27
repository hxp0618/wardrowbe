import { describe, expect, it } from 'vitest'

import { formatGreeting, translate } from './i18n'

describe('i18n helpers', () => {
  it('returns Chinese copy for page shell keys', () => {
    expect(translate('zh', 'page_wardrobe_title')).toBe('衣橱')
    expect(translate('page_wardrobe_title')).toBe('衣橱')
    expect(translate('zh', 'page_notifications_subtitle')).toBe('管理通知渠道和提醒计划')
  })

  it('formats dashboard greetings with Chinese templates', () => {
    expect(formatGreeting('zh', 'Ada Lovelace')).toBe('你好，Ada')
    expect(formatGreeting('Ada Lovelace')).toBe('你好，Ada')
    expect(formatGreeting('zh')).toBe('你好')
    expect(formatGreeting()).toBe('你好')
  })
})
