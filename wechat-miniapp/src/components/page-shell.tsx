import type { ReactNode } from 'react'

import { Text, View } from '@tarojs/components'

type PageShellProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export function PageShell(props: PageShellProps) {
  return (
    <View
      style={{
        minHeight: '100vh',
        backgroundColor: '#F3F4F6',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <View style={{ marginBottom: '20px' }}>
        <View
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                display: 'block',
                fontSize: '32px',
                fontWeight: 600,
                color: '#111827',
              }}
            >
              {props.title}
            </Text>
            {props.subtitle ? (
              <Text
                style={{
                  display: 'block',
                  marginTop: '8px',
                  fontSize: '24px',
                  color: '#6B7280',
                  lineHeight: 1.5,
                }}
              >
                {props.subtitle}
              </Text>
            ) : null}
          </View>
          {props.actions ? <View>{props.actions}</View> : null}
        </View>
      </View>
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {props.children}
      </View>
    </View>
  )
}
