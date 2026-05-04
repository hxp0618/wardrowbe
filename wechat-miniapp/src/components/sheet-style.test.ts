import { describe, expect, it } from 'vitest'

import {
  flatActionFormStyle,
  flatDetailBlockStyle,
  sheetBackdropStyle,
  sheetContentStyle,
  sheetHandleStyle,
  sheetHandleTrackStyle,
  sheetOverlayStyle,
  sheetPanelStyle,
  sheetScrollBodyStyle,
} from './sheet-style'

describe('shared sheet styles', () => {
  it('centralizes bottom sheet shell styles', () => {
    expect(sheetOverlayStyle).toMatchObject({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      zIndex: 1000,
    })
    expect(sheetBackdropStyle.backgroundColor).toBe('rgba(0,0,0,0.5)')
    expect(sheetPanelStyle).toMatchObject({
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '82vh',
      maxHeight: '82vh',
      display: 'flex',
      flexDirection: 'column',
    })
  })

  it('keeps sheet scroll locked to the foreground sheet', () => {
    expect(sheetScrollBodyStyle).toMatchObject({
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      overscrollBehavior: 'contain',
    })
    expect(sheetHandleTrackStyle).toMatchObject({ display: 'flex', justifyContent: 'center' })
    expect(sheetHandleStyle).toMatchObject({ width: '40px', height: '4px' })
    expect(sheetContentStyle.padding).toBe('0 16px 28px')
  })

  it('shares flat content block spacing between detail sheets', () => {
    expect(flatDetailBlockStyle.marginBottom).toBe('12px')
    expect(flatDetailBlockStyle.borderTop).toContain('var(--wb-color-border)')
    expect(flatActionFormStyle.padding).toBe('10px 0')
    expect(flatActionFormStyle.borderTop).toContain('var(--wb-color-border)')
  })
})
