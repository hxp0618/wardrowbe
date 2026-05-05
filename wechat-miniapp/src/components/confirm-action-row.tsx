import { Text, View } from '@tarojs/components'

import {
  actionRowStyle,
  getActionButtonStyle,
  getEnabledActionHandler,
} from './action-style'
import { colors, solidActionBackgrounds, solidActionTextColor } from './ui-theme'

export type ConfirmActionRowTone = 'primary' | 'danger'

type ConfirmActionRowProps = {
  cancelLabel: string
  confirmLabel: string
  cancelAriaLabel?: string
  confirmAriaLabel?: string
  onCancel: () => void
  onConfirm: () => void
  pending?: boolean
  /**
   * `'primary'` uses the accent palette (e.g., archive confirm).
   * `'danger'` uses the solid red intent (e.g., delete confirm).
   * Defaults to `'primary'`.
   */
  tone?: ConfirmActionRowTone
}

/**
 * Two-button confirmation row that replaces a single primary action when the
 * user has tapped a destructive trigger. Shared by item-detail-sheet,
 * outfit-detail-sheet, and any flow that needs an inline cancel/confirm pair.
 */
export function ConfirmActionRow(props: ConfirmActionRowProps) {
  const tone = props.tone ?? 'primary'
  const pending = !!props.pending

  const confirmStyle =
    tone === 'danger'
      ? {
          ...getActionButtonStyle({ variant: 'primary', flex: 1, disabled: pending }),
          backgroundColor: solidActionBackgrounds.danger,
        }
      : getActionButtonStyle({ variant: 'primary', flex: 1, disabled: pending })

  const confirmTextColor = tone === 'danger' ? solidActionTextColor : colors.accentText

  return (
    <View style={{ ...actionRowStyle, gap: '10px' }}>
      <View
        ariaRole='button'
        ariaLabel={props.cancelAriaLabel ?? props.cancelLabel}
        onClick={props.onCancel}
        style={getActionButtonStyle({ flex: 1 })}
      >
        <Text style={{ fontSize: '14px', color: colors.text }}>{props.cancelLabel}</Text>
      </View>
      <View
        ariaRole='button'
        ariaLabel={props.confirmAriaLabel ?? props.confirmLabel}
        onClick={getEnabledActionHandler(pending, props.onConfirm)}
        style={confirmStyle}
      >
        <Text style={{ fontSize: '14px', color: confirmTextColor }}>{props.confirmLabel}</Text>
      </View>
    </View>
  )
}
