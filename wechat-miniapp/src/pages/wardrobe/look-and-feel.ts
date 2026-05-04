import type { CSSProperties } from 'react'

import { getEditorialCardStyle, getEditorialRaisedPanelStyle } from '../../components/editorial-style'

export const WARDROBE_UPLOADED_ITEM_HIGHLIGHT_MS = 1800

export function getWardrobeSectionCardStyle(): CSSProperties {
  return getEditorialRaisedPanelStyle()
}

export function getWardrobeFilterPanelStyle(): CSSProperties {
  return {
    ...getWardrobeSectionCardStyle(),
    padding: '14px',
  }
}

export function getWardrobeItemCardShellStyle(): CSSProperties {
  return getEditorialCardStyle()
}

export function getWardrobeUploadedItemAnchor(itemId: string): string {
  return `wardrobe-item-${itemId}`
}

export function getWardrobeUploadedItemStyle(isHighlighted: boolean): CSSProperties {
  if (!isHighlighted) return {}

  return {
    backgroundColor: 'var(--wb-color-surface-selected)',
    border: '1px solid var(--wb-color-border-strong)',
  }
}
