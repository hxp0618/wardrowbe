import type { CSSProperties, ReactNode } from 'react'

import { Text, View } from '@tarojs/components'

import { cardStyle, colors, sectionTitleStyle } from './ui-theme'

type SectionCardProps = {
  title: string
  extra?: ReactNode
  children: ReactNode
  style?: CSSProperties
  contentStyle?: CSSProperties
}

export function SectionCard(props: SectionCardProps) {
  return (
    <View
      style={{
        ...cardStyle,
        padding: '20px',
        ...props.style,
      }}
    >
      <View
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <Text style={sectionTitleStyle}>{props.title}</Text>
        {props.extra ? <View>{props.extra}</View> : null}
      </View>
      <View style={{ color: colors.text, ...props.contentStyle }}>{props.children}</View>
    </View>
  )
}
