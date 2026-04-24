import { describe, expect, it } from 'vitest'

import { resolveHeaderMetrics } from './header-metrics'

describe('resolveHeaderMetrics', () => {
  it('matches the native mini-program title bar rhythm when menu metrics are available', () => {
    const metrics = resolveHeaderMetrics({
      statusBarHeight: 24,
      menuButtonRect: {
        top: 30,
        height: 32,
      },
    })

    expect(metrics).toEqual({
      paddingTop: 28,
      contentHeight: 36,
      paddingBottom: 4,
    })
  })

  it('falls back to a stable header height without menu button metrics', () => {
    const metrics = resolveHeaderMetrics({
      statusBarHeight: 20,
    })

    expect(metrics).toEqual({
      paddingTop: 26,
      contentHeight: 36,
      paddingBottom: 8,
    })
  })
})
