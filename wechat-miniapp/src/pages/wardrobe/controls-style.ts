import type { CSSProperties } from 'react'

import {
  getEditorialChipLabelStyle,
  getEditorialChipStyle,
  getEditorialCompactButtonStyle,
  getEditorialPickerIconStyle,
  getEditorialPickerLabelStyle,
  getEditorialPickerTriggerStyle,
} from '../../components/editorial-style'

import { colors } from '../../components/ui-theme'

type WardrobeChipTone = 'default' | 'favorite' | 'warning'

export function getWardrobePickerStyle(): CSSProperties {
  return getEditorialPickerTriggerStyle()
}

export function getWardrobePickerLabelStyle(): CSSProperties {
  return getEditorialPickerLabelStyle()
}

export function getWardrobePickerIconStyle(): CSSProperties {
  return getEditorialPickerIconStyle()
}

export function getWardrobeChipStyle(
  active: boolean,
  tone: WardrobeChipTone = 'default'
): CSSProperties {
  if (active && tone === 'favorite') {
    return getEditorialChipStyle(true)
  }

  if (active && tone === 'warning') {
    return getEditorialChipStyle(true, 'warning')
  }

  if (active) {
    return {
      minHeight: '32px',
      padding: '0 12px',
      borderRadius: '999px',
      backgroundColor: colors.surfaceSelected,
      color: colors.text,
      border: `1px solid ${colors.borderStrong}`,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  }

  return {
    minHeight: '32px',
    padding: '0 12px',
    borderRadius: '999px',
    backgroundColor: colors.surface,
    color: colors.textMuted,
    border: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}

export function getWardrobeChipLabelStyle(active: boolean): CSSProperties {
  return getEditorialChipLabelStyle(active)
}

export function getWardrobeCompactActionStyle(): CSSProperties {
  return getEditorialCompactButtonStyle()
}
