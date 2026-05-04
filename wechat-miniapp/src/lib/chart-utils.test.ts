import { describe, expect, it } from 'vitest'

import { clampPercent, normalizeChartId } from './chart-utils'

describe('chart utils', () => {
  it('clamps chart percentages to whole values from 0 to 100', () => {
    expect(clampPercent(Number.NaN)).toBe(0)
    expect(clampPercent(-12.4)).toBe(0)
    expect(clampPercent(45.6)).toBe(46)
    expect(clampPercent(120)).toBe(100)
  })

  it('normalizes chart ids for aria labels', () => {
    expect(normalizeChartId('spring office')).toBe('spring-office')
    expect(normalizeChartId('navy/blue:2026')).toBe('navy-blue-2026')
  })
})
