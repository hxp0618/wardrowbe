import { describe, expect, it } from 'vitest'

import {
  headersToPairs,
  normalizeWebhookPreset,
  pairsToHeaders,
} from '@/lib/webhook-utils'

describe('webhook-utils', () => {
  it('normalizes legacy and missing presets to the plan-aligned preset value', () => {
    expect(normalizeWebhookPreset(undefined, undefined)).toBe('generic')
    expect(normalizeWebhookPreset(undefined, 'json')).toBe('generic')
    expect(normalizeWebhookPreset(undefined, 'wecom')).toBe('wechat_work')
    expect(normalizeWebhookPreset('discord', undefined)).toBe('discord')
  })

  it('converts header pairs to a compact object', () => {
    expect(
      pairsToHeaders([
        { id: '1', key: 'Authorization', value: 'Bearer token' },
        { id: '2', key: '  ', value: 'ignored' },
        { id: '3', key: 'X-Secret', value: 'abc' },
      ]),
    ).toEqual({
      Authorization: 'Bearer token',
      'X-Secret': 'abc',
    })
  })

  it('expands stored header objects into editable key/value rows', () => {
    const pairs = headersToPairs({
      Authorization: 'Bearer token',
      'X-Secret': 'abc',
    })

    expect(pairs).toHaveLength(2)
    expect(pairs[0]).toMatchObject({ key: 'Authorization', value: 'Bearer token' })
    expect(pairs[1]).toMatchObject({ key: 'X-Secret', value: 'abc' })
  })
})
