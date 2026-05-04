import type { CSSProperties, ReactNode } from 'react'

import { Text, View } from '@tarojs/components'

import { cardStyle, colors, sectionTitleStyle } from './ui-theme'

type SectionCardProps = {
  title: string
  extra?: ReactNode
  children: ReactNode
  compact?: boolean
  onClick?: () => void
  ariaLabel?: string
  style?: CSSProperties
  contentStyle?: CSSProperties
}

export function SectionCard(props: SectionCardProps) {
  const compact = props.compact ?? false

  return (
    <View
      ariaRole={props.onClick ? 'button' : undefined}
      ariaLabel={props.onClick ? props.ariaLabel ?? props.title : props.ariaLabel}
      onClick={props.onClick}
      style={{
        ...cardStyle,
        minHeight: props.onClick ? '44px' : undefined,
        padding: compact ? '12px' : '16px',
        ...props.style,
      }}
    >
      <View
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: compact ? '8px' : '12px',
        }}
      >
        <Text style={sectionTitleStyle}>{props.title}</Text>
        {props.extra ? <View>{props.extra}</View> : null}
      </View>
      <View style={{ color: colors.text, ...props.contentStyle }}>{props.children}</View>
    </View>
  )
}
