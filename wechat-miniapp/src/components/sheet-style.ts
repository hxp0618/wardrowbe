import type { CSSProperties } from 'react'

import { colors } from './ui-theme'

export const sheetOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  zIndex: 1000,
}

export const sheetBackdropStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
}

export const sheetPanelStyle: CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '82vh',
  maxHeight: '82vh',
  backgroundColor: colors.surface,
  borderRadius: '18px 18px 0 0',
  display: 'flex',
  flexDirection: 'column',
  borderTop: `1px solid ${colors.border}`,
}

export const sheetHandleTrackStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '8px 0 6px',
}

export const sheetHandleStyle: CSSProperties = {
  width: '40px',
  height: '4px',
  borderRadius: '2px',
  backgroundColor: colors.sheetHandle,
}

export const sheetScrollBodyStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
}

export const sheetContentStyle: CSSProperties = {
  padding: '0 16px 28px',
}

export const flatDetailBlockStyle: CSSProperties = {
  marginBottom: '12px',
  padding: '10px 0',
  borderTop: `1px solid ${colors.border}`,
}

export const flatActionFormStyle: CSSProperties = {
  marginBottom: '12px',
  padding: '10px 0',
  borderTop: `1px solid ${colors.border}`,
}
