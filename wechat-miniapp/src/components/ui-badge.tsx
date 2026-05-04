import { Text } from '@tarojs/components'

import { getToneActionSurfaceStyle, getToneTextColor } from './action-style'
import { colors } from './ui-theme'

type UIBadgeProps = {
  label: string
  tone?: 'default' | 'success' | 'danger' | 'warning'
}

function resolveTone(tone: UIBadgeProps['tone']) {
  if (tone) {
    return {
      color: getToneTextColor(tone),
      ...getToneActionSurfaceStyle(tone),
    }
  }

  return {
    color: colors.textMuted,
    ...getToneActionSurfaceStyle('default'),
  }
}

export function UIBadge(props: UIBadgeProps) {
  const tone = resolveTone(props.tone)

  return (
    <Text
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        lineHeight: 1.2,
        ...tone,
      }}
    >
      {props.label}
    </Text>
  )
}
