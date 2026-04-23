import { Text, View } from '@tarojs/components'
import type { ReactNode } from 'react'

import { cardStyle, colors } from './ui-theme'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState(props: EmptyStateProps) {
  return (
    <View
      style={{
        ...cardStyle,
        padding: '24px',
      }}
    >
      <Text
        style={{
          display: 'block',
          fontSize: '18px',
          fontWeight: 600,
          color: colors.text,
        }}
      >
        {props.title}
      </Text>
      <Text
        style={{
          display: 'block',
          marginTop: '10px',
          fontSize: '14px',
          color: colors.textMuted,
          lineHeight: 1.5,
        }}
      >
        {props.description}
      </Text>
      {props.action ? (
        <View
          style={{
            marginTop: '16px',
          }}
        >
          {props.action}
        </View>
      ) : null}
    </View>
  )
}
