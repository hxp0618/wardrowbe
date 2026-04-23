import { Text } from '@tarojs/components'

import { colors } from './ui-theme'

type UIBadgeProps = {
  label: string
  tone?: 'default' | 'success' | 'danger' | 'warning'
}

function resolveTone(tone: UIBadgeProps['tone']) {
  if (tone === 'success') {
    return {
      color: colors.success,
      backgroundColor: 'rgba(52, 211, 153, 0.12)',
      border: '1px solid rgba(52, 211, 153, 0.22)',
    }
  }
  if (tone === 'danger') {
    return {
      color: colors.danger,
      backgroundColor: 'rgba(248, 113, 113, 0.12)',
      border: '1px solid rgba(248, 113, 113, 0.22)',
    }
  }
  if (tone === 'warning') {
    return {
      color: colors.warning,
      backgroundColor: 'rgba(251, 191, 36, 0.12)',
      border: '1px solid rgba(251, 191, 36, 0.22)',
    }
  }
  return {
    color: colors.textMuted,
    backgroundColor: colors.surfaceMuted,
    border: `1px solid ${colors.border}`,
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
