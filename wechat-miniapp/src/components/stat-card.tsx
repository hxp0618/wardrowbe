import type { CSSProperties } from 'react'

import { Text, View } from '@tarojs/components'

import { cardStyle, colors } from './ui-theme'

type StatCardProps = {
  label: string
  value: string
  hint?: string
  style?: CSSProperties
}

export function StatCard(props: StatCardProps) {
  return (
    <View
      style={{
        ...cardStyle,
        flex: 1,
        minWidth: '120px',
        padding: '16px',
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
          marginTop: '10px',
          fontSize: '28px',
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
            marginTop: '8px',
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
