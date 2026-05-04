import { describe, expect, it } from 'vitest'

import { TIMEZONE_OPTIONS, findTimezoneOption } from './timezone-options'

describe('timezone options', () => {
  it('centralizes supported profile timezone choices', () => {
    expect(TIMEZONE_OPTIONS.map((option) => option.value)).toEqual([
      'Asia/Shanghai',
      'Asia/Tokyo',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'UTC',
    ])
  })

  it('finds timezone labels by value', () => {
    expect(findTimezoneOption('Asia/Shanghai')?.zh).toBe('北京时间 (Asia/Shanghai)')
    expect(findTimezoneOption('Unknown/Zone')).toBeUndefined()
  })
})
