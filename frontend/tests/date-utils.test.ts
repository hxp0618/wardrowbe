import { describe, expect, it } from 'vitest'

import {
  getForecastDaysForTargetDate,
  isFutureISODate,
  toLocalISODate,
} from '@/lib/date-utils'

describe('date-utils', () => {
  it('formats local dates without converting through UTC', () => {
    const date = new Date(2026, 3, 17, 23, 30, 0)

    expect(toLocalISODate(date)).toBe('2026-04-17')
  })

  it('detects whether a target date is after the local today', () => {
    const today = new Date(2026, 3, 17, 9, 0, 0)

    expect(isFutureISODate('', today)).toBe(false)
    expect(isFutureISODate('2026-04-17', today)).toBe(false)
    expect(isFutureISODate('2026-04-18', today)).toBe(true)
  })

  it('returns the inclusive forecast day span needed for a future target date', () => {
    const today = new Date(2026, 3, 17, 9, 0, 0)

    expect(getForecastDaysForTargetDate('', today)).toBe(0)
    expect(getForecastDaysForTargetDate('2026-04-17', today)).toBe(0)
    expect(getForecastDaysForTargetDate('2026-04-18', today)).toBe(2)
    expect(getForecastDaysForTargetDate('2026-04-22', today)).toBe(6)
  })
})
