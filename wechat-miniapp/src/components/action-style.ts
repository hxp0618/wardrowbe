import type { CSSProperties } from 'react'

import {
  colors,
  primaryButtonStyle,
  secondaryButtonStyle,
  toneSurfaceStyle,
} from './ui-theme'

export type ActionTone = 'default' | 'success' | 'danger' | 'warning' | 'info'

export const TOUCH_TARGET_MIN_HEIGHT = '44px'
export const DEFAULT_DISABLED_ACTION_OPACITY = 0.7

export const actionRowStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
}

export const actionWrapRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
}

export const actionStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

export function getDisabledActionStyle(
  disabled: boolean,
  opacity: number = DEFAULT_DISABLED_ACTION_OPACITY
): CSSProperties {
  return { opacity: disabled ? opacity : 1 }
}

export function getEnabledActionHandler<Args extends unknown[], Result>(
  disabled: boolean,
  handler: (...args: Args) => Result
): ((...args: Args) => Result) | undefined {
  return disabled ? undefined : handler
}

export function getToneActionSurfaceStyle(tone: ActionTone): CSSProperties {
  if (tone === 'info') {
    return {
      backgroundColor: colors.infoSurface,
      border: `1px solid ${colors.infoBorder}`,
    }
  }

  if (tone === 'default') {
    return {
      backgroundColor: colors.surfaceMuted,
      border: `1px solid ${colors.border}`,
    }
  }

  return toneSurfaceStyle(tone)
}

export function getToneTextColor(tone: ActionTone): string {
  if (tone === 'success') return colors.success
  if (tone === 'danger') return colors.danger
  if (tone === 'warning') return colors.warning
  if (tone === 'info') return colors.infoText
  return colors.text
}

export function getActionButtonStyle(options: {
  variant?: 'primary' | 'secondary' | 'plain'
  tone?: ActionTone
  compact?: boolean
  disabled?: boolean
  disabledOpacity?: number
  flex?: CSSProperties['flex']
  minWidth?: CSSProperties['minWidth']
} = {}): CSSProperties {
  const {
    compact = false,
    disabled = false,
    disabledOpacity = DEFAULT_DISABLED_ACTION_OPACITY,
    flex,
    minWidth,
    tone,
    variant = 'secondary',
  } = options
  const variantStyle =
    variant === 'primary' ? primaryButtonStyle
    : variant === 'secondary' ? secondaryButtonStyle
    : {
        minHeight: TOUCH_TARGET_MIN_HEIGHT,
        padding: '10px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }

  return {
    ...variantStyle,
    ...(compact ? { minHeight: TOUCH_TARGET_MIN_HEIGHT, padding: '8px 12px' } : {}),
    ...(tone ? getToneActionSurfaceStyle(tone) : {}),
    ...getDisabledActionStyle(disabled, disabledOpacity),
    ...(flex == null ? {} : { flex }),
    ...(minWidth == null ? {} : { minWidth }),
  }
}
