import { describe, expect, it, vi } from 'vitest'

import {
  addDays,
  formatChineseDate,
  formatWeekdayLabel,
  getCurrentYearMonth,
  getForecastDaysForTargetDate,
  sortByOutfitDateDescending,
  toLocalISODate,
} from './date-utils'

describe('date utilities', () => {
  it('formats local calendar dates and adds days without mutating the source date', () => {
    const source = new Date(2026, 4, 3)
    const next = addDays(source, 15)

    expect(toLocalISODate(source)).toBe('2026-05-03')
    expect(toLocalISODate(next)).toBe('2026-05-18')
    expect(toLocalISODate(source)).toBe('2026-05-03')
  })

  it('returns the current local year and month', () => {
    expect(getCurrentYearMonth(new Date(2026, 4, 3))).toEqual({
      year: 2026,
      month: 5,
    })
  })

  it('formats compact Chinese display dates', () => {
    expect(formatChineseDate('2026-05-03T00:00:00Z')).toBe('2026年5月3日')
  })

  it('formats reminder weekday labels', () => {
    expect(formatWeekdayLabel(0)).toBe('周一')
    expect(formatWeekdayLabel(6)).toBe('周日')
    expect(formatWeekdayLabel(7)).toBe('周一')
  })

  it('calculates forecast days from a target date', () => {
    const today = new Date(2026, 4, 3)

    expect(getForecastDaysForTargetDate('2026-05-03', today)).toBe(0)
    expect(getForecastDaysForTargetDate('2026-05-04', today)).toBe(2)
    expect(getForecastDaysForTargetDate('2026-05-18', today)).toBe(16)
  })

  it('uses the current local date by default when calculating forecast days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 3, 12, 0, 0))

    expect(getForecastDaysForTargetDate('2026-05-04')).toBe(2)

    vi.useRealTimers()
  })

  it('sorts outfits by scheduled date first and created date as fallback', () => {
    const sorted = sortByOutfitDateDescending([
      { id: 'old', scheduled_for: '2026-05-01', created_at: '2026-05-03T00:00:00Z' },
      { id: 'newer', scheduled_for: '2026-05-03', created_at: '2026-05-01T00:00:00Z' },
      { id: 'fallback', scheduled_for: null, created_at: '2026-05-02T00:00:00Z' },
    ])

    expect(sorted.map((item) => item.id)).toEqual(['newer', 'fallback', 'old'])
  })
})
