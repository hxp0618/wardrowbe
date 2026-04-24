import { describe, expect, it } from 'vitest'

import { getThemeStyle } from './ui-theme'

describe('getThemeStyle', () => {
  it('provides semantic tokens for dark appearance', () => {
    const style = getThemeStyle('dark') as Record<string, string>

    expect(style['--wb-color-surface-selected']).toBeDefined()
    expect(style['--wb-color-avatar']).toBeDefined()
    expect(style['--wb-color-sheet-handle']).toBeDefined()
    expect(style['--wb-color-info-surface']).toBeDefined()
    expect(style['--wb-color-info-border']).toBeDefined()
    expect(style['--wb-color-info-text']).toBeDefined()
    expect(style['--wb-color-disabled-surface']).toBeDefined()
  })

  it('changes semantic token values for light appearance', () => {
    const darkStyle = getThemeStyle('dark') as Record<string, string>
    const lightStyle = getThemeStyle('light') as Record<string, string>

    expect(lightStyle['--wb-color-surface-selected']).not.toBe(
      darkStyle['--wb-color-surface-selected']
    )
    expect(lightStyle['--wb-color-avatar']).not.toBe(
      darkStyle['--wb-color-avatar']
    )
    expect(lightStyle['--wb-color-sheet-handle']).not.toBe(
      darkStyle['--wb-color-sheet-handle']
    )
    expect(lightStyle['--wb-color-info-surface']).not.toBe(
      darkStyle['--wb-color-info-surface']
    )
    expect(lightStyle['--wb-color-disabled-surface']).not.toBe(
      darkStyle['--wb-color-disabled-surface']
    )
  })
})
