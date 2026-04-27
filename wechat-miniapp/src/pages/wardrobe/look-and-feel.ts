import type { CSSProperties } from 'react'

import { getEditorialCardStyle, getEditorialRaisedPanelStyle } from '../../components/editorial-style'

export function getWardrobeSectionCardStyle(): CSSProperties {
  return getEditorialRaisedPanelStyle()
}

export function getWardrobeFilterPanelStyle(): CSSProperties {
  return {
    ...getWardrobeSectionCardStyle(),
    padding: '18px',
  }
}

export function getWardrobeItemCardShellStyle(): CSSProperties {
  return getEditorialCardStyle()
}
