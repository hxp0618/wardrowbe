import { describe, expect, it } from 'vitest'

import { resolveHeaderMetrics } from './header-metrics'

describe('resolveHeaderMetrics', () => {
  it('reserves horizontal space for the WeChat menu capsule', () => {
    expect(
      resolveHeaderMetrics({
        statusBarHeight: 47,
        windowWidth: 390,
        menuButtonRect: {
          top: 54,
          height: 32,
          left: 278,
          width: 87,
        },
      }).paddingRight
    ).toBe(120)
  })

  it('keeps the normal right padding when capsule geometry is unavailable', () => {
    expect(resolveHeaderMetrics().paddingRight).toBe(16)
  })
})
