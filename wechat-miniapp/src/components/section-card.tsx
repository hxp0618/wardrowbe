import type { ReactNode } from 'react'

import { Text, View } from '@tarojs/components'

type SectionCardProps = {
  title: string
  extra?: ReactNode
  children: ReactNode
}

export function SectionCard(props: SectionCardProps) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
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
        <Text
          style={{
            fontSize: '26px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          {props.title}
        </Text>
        {props.extra ? <View>{props.extra}</View> : null}
      </View>
      {props.children}
    </View>
  )
}
