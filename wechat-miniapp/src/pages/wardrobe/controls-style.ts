import type { CSSProperties } from 'react'

import { colors } from '../../components/ui-theme'

type WardrobeChipTone = 'default' | 'favorite' | 'warning'

export function getWardrobePickerStyle(): CSSProperties {
  return {
    width: '100%',
    minHeight: '40px',
    padding: '0 12px',
    borderRadius: '12px',
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  }
}

export function getWardrobePickerLabelStyle(): CSSProperties {
  return {
    flex: 1,
    fontSize: '13px',
    fontWeight: 600,
    color: colors.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
}

export function getWardrobePickerIconStyle(): CSSProperties {
  return {
    fontSize: '11px',
    color: colors.textSoft,
    flexShrink: 0,
  }
}

export function getWardrobeChipStyle(
  active: boolean,
  tone: WardrobeChipTone = 'default'
): CSSProperties {
  if (active && tone === 'favorite') {
    return {
      minHeight: '32px',
      padding: '0 12px',
      borderRadius: '999px',
      backgroundColor: colors.accent,
      color: colors.accentText,
      border: `1px solid ${colors.accent}`,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  }

  if (active && tone === 'warning') {
    return {
      minHeight: '32px',
      padding: '0 12px',
      borderRadius: '999px',
      backgroundColor: '#fffbeb',
      color: '#b45309',
      border: '1px solid #fcd34d',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
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
  return {
    fontSize: '12px',
    fontWeight: 600,
    color: active ? 'inherit' : colors.textMuted,
  }
}

export function getWardrobeCompactActionStyle(): CSSProperties {
  return {
    minHeight: '38px',
    padding: '0 12px',
    borderRadius: '12px',
  }
}
