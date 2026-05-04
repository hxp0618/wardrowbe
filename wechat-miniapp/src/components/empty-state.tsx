import { Text, View } from '@tarojs/components'
import type { ReactNode } from 'react'

import { cardStyle, colors } from './ui-theme'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
  embedded?: boolean
}

export function EmptyState(props: EmptyStateProps) {
  const containerStyle = props.embedded
    ? {
        padding: '6px 0',
        boxSizing: 'border-box',
      }
    : {
        ...cardStyle,
        padding: '16px',
      }

  return (
    <View
      style={containerStyle}
    >
      <Text
        style={{
          display: 'block',
          fontSize: '16px',
          fontWeight: 600,
          color: colors.text,
        }}
      >
        {props.title}
      </Text>
      <Text
        style={{
          display: 'block',
          marginTop: '6px',
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
            marginTop: '12px',
          }}
        >
          {props.action}
        </View>
      ) : null}
    </View>
  )
}
