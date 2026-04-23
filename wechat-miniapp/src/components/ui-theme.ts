import type { CSSProperties } from 'react'

export const colors = {
  page: '#050505',
  surface: '#0b0b0d',
  surfaceRaised: '#121216',
  surfaceMuted: '#17171c',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  text: '#f5f5f5',
  textMuted: '#a1a1aa',
  textSoft: '#71717a',
  accent: '#f4f4f5',
  accentText: '#09090b',
  success: '#34d399',
  danger: '#f87171',
  warning: '#fbbf24',
}

export const pagePadding = '16px'
export const cardRadius = '20px'
export const controlRadius = '14px'

export const titleTextStyle: CSSProperties = {
  display: 'block',
  color: colors.text,
  fontSize: '28px',
  fontWeight: 700,
  lineHeight: 1.2,
}

export const subtitleTextStyle: CSSProperties = {
  display: 'block',
  marginTop: '8px',
  color: colors.textMuted,
  fontSize: '14px',
  lineHeight: 1.6,
}

export const sectionTitleStyle: CSSProperties = {
  color: colors.text,
  fontSize: '17px',
  fontWeight: 600,
}

export const cardStyle: CSSProperties = {
  backgroundColor: colors.surface,
  borderRadius: cardRadius,
  border: `1px solid ${colors.border}`,
  boxSizing: 'border-box',
}

export const inputStyle: CSSProperties = {
  width: '100%',
  height: '44px',
  padding: '0 14px',
  borderRadius: controlRadius,
  backgroundColor: colors.surfaceMuted,
  border: `1px solid ${colors.border}`,
  boxSizing: 'border-box',
  color: colors.text,
}

export const primaryButtonStyle: CSSProperties = {
  minHeight: '44px',
  padding: '12px 14px',
  borderRadius: controlRadius,
  backgroundColor: colors.accent,
  color: colors.accentText,
  textAlign: 'center',
  boxSizing: 'border-box',
}

export const secondaryButtonStyle: CSSProperties = {
  minHeight: '44px',
  padding: '12px 14px',
  borderRadius: controlRadius,
  border: `1px solid ${colors.borderStrong}`,
  backgroundColor: colors.surfaceMuted,
  color: colors.text,
  textAlign: 'center',
  boxSizing: 'border-box',
}

export function toneSurfaceStyle(tone: 'default' | 'success' | 'danger' | 'warning'): CSSProperties {
  if (tone === 'success') {
    return {
      backgroundColor: 'rgba(52, 211, 153, 0.12)',
      border: '1px solid rgba(52, 211, 153, 0.22)',
    }
  }
  if (tone === 'danger') {
    return {
      backgroundColor: 'rgba(248, 113, 113, 0.12)',
      border: '1px solid rgba(248, 113, 113, 0.22)',
    }
  }
  if (tone === 'warning') {
    return {
      backgroundColor: 'rgba(251, 191, 36, 0.12)',
      border: '1px solid rgba(251, 191, 36, 0.22)',
    }
  }
  return {
    backgroundColor: colors.surfaceMuted,
    border: `1px solid ${colors.border}`,
  }
}
