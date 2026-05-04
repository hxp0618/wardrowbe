import { describe, expect, it } from 'vitest'

import {
  NOTIFICATION_CHANNEL_OPTIONS,
  WEBHOOK_CONTENT_TYPE_OPTIONS,
  WEBHOOK_METHOD_OPTIONS,
  WEBHOOK_PRESET_OPTIONS,
  getDefaultBarkServer,
} from './notification-options'

describe('notification options', () => {
  it('centralizes notification channel and webhook selector values', () => {
    expect(NOTIFICATION_CHANNEL_OPTIONS).toEqual(['email', 'webhook', 'ntfy', 'mattermost', 'bark'])
    expect(WEBHOOK_PRESET_OPTIONS).toEqual(['generic', 'telegram', 'discord', 'slack', 'feishu', 'wechat_work'])
    expect(WEBHOOK_METHOD_OPTIONS).toEqual(['POST', 'PUT'])
    expect(WEBHOOK_CONTENT_TYPE_OPTIONS).toEqual(['application/json', 'application/x-www-form-urlencoded'])
  })

  it('shares the Bark server fallback', () => {
    expect(getDefaultBarkServer()).toBe('https://api.day.app')
    expect(getDefaultBarkServer('https://example.test')).toBe('https://example.test')
  })
})
