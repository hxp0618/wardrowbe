import type { CSSProperties } from 'react'

import type { AppAppearance } from '../stores/auth'

const darkPalette = {
  page: '#050505',
  surface: '#0b0b0d',
  surfaceRaised: '#121216',
  surfaceMuted: '#17171c',
  surfaceSelected: '#27272a',
  surfaceFloating: 'rgba(11, 11, 13, 0.96)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  text: '#f5f5f5',
  textMuted: '#a1a1aa',
  textSoft: '#71717a',
  avatar: '#27272a',
  sheetHandle: '#3f3f46',
  accent: '#f4f4f5',
  accentText: '#09090b',
  success: '#34d399',
  danger: '#f87171',
  warning: '#fbbf24',
  infoSurface: '#172554',
  infoBorder: '#1d4ed8',
  infoText: '#93c5fd',
  disabledSurface: '#71717a',
}

const lightPalette = {
  page: '#f5f5f4',
  surface: '#ffffff',
  surfaceRaised: '#fafaf9',
  surfaceMuted: '#f2f2f0',
  surfaceSelected: '#e7e5e4',
  surfaceFloating: 'rgba(255, 255, 255, 0.96)',
  border: 'rgba(9, 9, 11, 0.08)',
  borderStrong: 'rgba(9, 9, 11, 0.16)',
  text: '#09090b',
  textMuted: '#52525b',
  textSoft: '#71717a',
  avatar: '#e7e5e4',
  sheetHandle: '#a8a29e',
  accent: '#18181b',
  accentText: '#fafafa',
  success: '#059669',
  danger: '#dc2626',
  warning: '#d97706',
  infoSurface: '#dbeafe',
  infoBorder: '#93c5fd',
  infoText: '#1d4ed8',
  disabledSurface: '#a1a1aa',
}

export const colors = {
  page: 'var(--wb-color-page)',
  surface: 'var(--wb-color-surface)',
  surfaceRaised: 'var(--wb-color-surface-raised)',
  surfaceMuted: 'var(--wb-color-surface-muted)',
  surfaceSelected: 'var(--wb-color-surface-selected)',
  surfaceFloating: 'var(--wb-color-surface-floating)',
  border: 'var(--wb-color-border)',
  borderStrong: 'var(--wb-color-border-strong)',
  text: 'var(--wb-color-text)',
  textMuted: 'var(--wb-color-text-muted)',
  textSoft: 'var(--wb-color-text-soft)',
  avatar: 'var(--wb-color-avatar)',
  sheetHandle: 'var(--wb-color-sheet-handle)',
  accent: 'var(--wb-color-accent)',
  accentText: 'var(--wb-color-accent-text)',
  success: 'var(--wb-color-success)',
  danger: 'var(--wb-color-danger)',
  warning: 'var(--wb-color-warning)',
  infoSurface: 'var(--wb-color-info-surface)',
  infoBorder: 'var(--wb-color-info-border)',
  infoText: 'var(--wb-color-info-text)',
  disabledSurface: 'var(--wb-color-disabled-surface)',
}

export function getThemeStyle(appearance: AppAppearance): CSSProperties {
  const palette = appearance === 'light' ? lightPalette : darkPalette

  return {
    '--wb-color-page': palette.page,
    '--wb-color-surface': palette.surface,
    '--wb-color-surface-raised': palette.surfaceRaised,
    '--wb-color-surface-muted': palette.surfaceMuted,
    '--wb-color-surface-selected': palette.surfaceSelected,
    '--wb-color-surface-floating': palette.surfaceFloating,
    '--wb-color-border': palette.border,
    '--wb-color-border-strong': palette.borderStrong,
    '--wb-color-text': palette.text,
    '--wb-color-text-muted': palette.textMuted,
    '--wb-color-text-soft': palette.textSoft,
    '--wb-color-avatar': palette.avatar,
    '--wb-color-sheet-handle': palette.sheetHandle,
    '--wb-color-accent': palette.accent,
    '--wb-color-accent-text': palette.accentText,
    '--wb-color-success': palette.success,
    '--wb-color-danger': palette.danger,
    '--wb-color-warning': palette.warning,
    '--wb-color-info-surface': palette.infoSurface,
    '--wb-color-info-border': palette.infoBorder,
    '--wb-color-info-text': palette.infoText,
    '--wb-color-disabled-surface': palette.disabledSurface,
  } as CSSProperties
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
