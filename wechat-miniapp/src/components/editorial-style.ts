import type { CSSProperties } from 'react'

import { colors } from './ui-theme'

type EditorialChipTone = 'default' | 'warning'

export function getEditorialRaisedPanelStyle(): CSSProperties {
  return {
    backgroundColor: colors.surfaceRaised,
    borderRadius: '22px',
    border: '1px solid rgba(9, 9, 11, 0.04)',
    boxShadow: '0 8px 24px rgba(24, 24, 27, 0.04)',
  }
}

export function getEditorialCardStyle(): CSSProperties {
  return {
    backgroundColor: colors.surface,
    borderRadius: '22px',
    border: '1px solid rgba(9, 9, 11, 0.06)',
    boxShadow: '0 10px 24px rgba(24, 24, 27, 0.04)',
  }
}

export function getEditorialFeatureCardStyle(): CSSProperties {
  return {
    borderRadius: '26px',
    backgroundColor: 'rgba(255, 249, 241, 0.96)',
    border: '1px solid rgba(188, 146, 96, 0.18)',
    boxShadow: '0 18px 40px rgba(82, 62, 40, 0.08)',
  }
}

export function getEditorialTintedPanelStyle(
  tint: 'sky' | 'sage' | 'rose'
): CSSProperties {
  if (tint === 'sage') {
    return {
      borderRadius: '20px',
      backgroundColor: 'rgba(220, 241, 229, 0.92)',
      border: '1px solid rgba(110, 168, 134, 0.22)',
    }
  }

  if (tint === 'rose') {
    return {
      borderRadius: '20px',
      backgroundColor: 'rgba(248, 231, 234, 0.92)',
      border: '1px solid rgba(204, 128, 140, 0.2)',
    }
  }

  return {
    borderRadius: '20px',
    backgroundColor: 'rgba(228, 240, 250, 0.94)',
    border: '1px solid rgba(114, 149, 187, 0.2)',
  }
}

export function getEditorialMetricTileStyle(
  tint: 'sand' | 'sky' | 'sage'
): CSSProperties {
  if (tint === 'sage') {
    return {
      borderRadius: '18px',
      backgroundColor: 'rgba(220, 241, 229, 0.96)',
      border: '1px solid rgba(110, 168, 134, 0.2)',
      padding: '12px 14px',
      boxSizing: 'border-box',
    }
  }

  if (tint === 'sky') {
    return {
      borderRadius: '18px',
      backgroundColor: 'rgba(228, 240, 250, 0.98)',
      border: '1px solid rgba(114, 149, 187, 0.2)',
      padding: '12px 14px',
      boxSizing: 'border-box',
    }
  }

  return {
    borderRadius: '18px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(188, 146, 96, 0.16)',
    padding: '12px 14px',
    boxSizing: 'border-box',
  }
}

export function getEditorialPickerTriggerStyle(): CSSProperties {
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

export function getEditorialPickerLabelStyle(): CSSProperties {
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

export function getEditorialPickerIconStyle(): CSSProperties {
  return {
    fontSize: '11px',
    color: colors.textSoft,
    flexShrink: 0,
  }
}

export function getEditorialChipStyle(
  active: boolean,
  tone: EditorialChipTone = 'default'
): CSSProperties {
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
      backgroundColor: colors.accent,
      color: colors.accentText,
      border: `1px solid ${colors.accent}`,
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

export function getEditorialChipLabelStyle(active: boolean): CSSProperties {
  return {
    fontSize: '12px',
    fontWeight: 600,
    color: active ? 'inherit' : colors.textMuted,
  }
}

export function getEditorialCompactButtonStyle(): CSSProperties {
  return {
    minHeight: '38px',
    padding: '0 12px',
    borderRadius: '12px',
  }
}
