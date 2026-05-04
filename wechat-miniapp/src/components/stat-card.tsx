import type { CSSProperties } from 'react'

import { Text, View } from '@tarojs/components'

import { cardStyle, colors } from './ui-theme'

type StatCardProps = {
  label: string
  value: string
  hint?: string
  compact?: boolean
  onClick?: () => void
  style?: CSSProperties
}

export function StatCard(props: StatCardProps) {
  const compact = props.compact ?? false
  const accessibleLabel = [props.label, props.value, props.hint]
    .filter(Boolean)
    .join(' ')

  return (
    <View
      ariaRole={props.onClick ? 'button' : undefined}
      ariaLabel={props.onClick ? accessibleLabel : undefined}
      onClick={props.onClick}
      style={{
        ...cardStyle,
        flex: 1,
        minHeight: props.onClick ? '44px' : undefined,
        minWidth: compact ? '96px' : '120px',
        padding: compact ? '12px' : '16px',
        ...props.style,
      }}
    >
      <Text
        style={{
          display: 'block',
          fontSize: '12px',
          color: colors.textMuted,
        }}
      >
        {props.label}
      </Text>
      <Text
        style={{
          display: 'block',
          marginTop: compact ? '6px' : '10px',
          fontSize: compact ? '22px' : '28px',
          fontWeight: 700,
          color: colors.text,
        }}
      >
        {props.value}
      </Text>
      {props.hint ? (
        <Text
          style={{
            display: 'block',
            marginTop: compact ? '4px' : '8px',
            fontSize: '12px',
            color: colors.textSoft,
          }}
        >
          {props.hint}
        </Text>
      ) : null}
    </View>
  )
}
