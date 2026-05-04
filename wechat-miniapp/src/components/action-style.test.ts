import { describe, expect, it } from 'vitest'

import {
  DEFAULT_DISABLED_ACTION_OPACITY,
  TOUCH_TARGET_MIN_HEIGHT,
  actionRowStyle,
  actionWrapRowStyle,
  getActionButtonStyle,
  getDisabledActionStyle,
  getEnabledActionHandler,
  getToneActionSurfaceStyle,
  getToneTextColor,
} from './action-style'
import { colors } from './ui-theme'

describe('shared action styles', () => {
  it('keeps disabled action opacity in one place', () => {
    expect(DEFAULT_DISABLED_ACTION_OPACITY).toBe(0.7)
    expect(getDisabledActionStyle(true)).toEqual({ opacity: 0.7 })
    expect(getDisabledActionStyle(false)).toEqual({ opacity: 1 })
    expect(getDisabledActionStyle(true, 0.6)).toEqual({ opacity: 0.6 })
  })

  it('keeps touchable action buttons large enough by default', () => {
    expect(TOUCH_TARGET_MIN_HEIGHT).toBe('44px')
    expect(getActionButtonStyle().minHeight).toBe('44px')
    expect(getActionButtonStyle({ compact: true }).minHeight).toBe('44px')
    expect(getActionButtonStyle({ tone: 'success' }).boxSizing).toBe('border-box')
  })

  it('centralizes action rows and semantic tone surfaces', () => {
    expect(actionRowStyle).toEqual({ display: 'flex', gap: '8px' })
    expect(actionWrapRowStyle).toEqual({ display: 'flex', flexWrap: 'wrap', gap: '8px' })
    expect(getToneActionSurfaceStyle('danger')).toMatchObject({
      backgroundColor: 'rgba(248, 113, 113, 0.12)',
      border: '1px solid rgba(248, 113, 113, 0.22)',
    })
    expect(getToneActionSurfaceStyle('info')).toMatchObject({
      backgroundColor: colors.infoSurface,
      border: `1px solid ${colors.infoBorder}`,
    })
    expect(getToneTextColor('warning')).toBe(colors.warning)
  })

  it('removes click handlers for disabled actions', () => {
    const handler = () => 'clicked'

    expect(getEnabledActionHandler(false, handler)).toBe(handler)
    expect(getEnabledActionHandler(true, handler)).toBeUndefined()
  })
})
