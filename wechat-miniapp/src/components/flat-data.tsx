import type { CSSProperties, ReactNode } from 'react'

import { Text, View } from '@tarojs/components'

import { colors } from './ui-theme'

export type FlatMetric = {
  label: string
  value: string
  hint?: string
  onClick?: () => void
  ariaLabel?: string
}

type FlatMetricGridProps = {
  metrics: FlatMetric[]
  style?: CSSProperties
}

type FlatListProps = {
  children: ReactNode
  style?: CSSProperties
}

type FlatListRowProps = {
  children: ReactNode
  style?: CSSProperties
}

type FlatSectionProps = {
  title: string
  extra?: ReactNode
  children: ReactNode
  style?: CSSProperties
  contentStyle?: CSSProperties
}

export function FlatMetricGrid(props: FlatMetricGridProps) {
  return (
    <View
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 12px',
        borderTop: `1px solid ${colors.border}`,
        ...props.style,
      }}
    >
      {props.metrics.map((metric) => (
        <View
          key={metric.label}
          ariaRole={metric.onClick ? 'button' : undefined}
          ariaLabel={
            metric.onClick
              ? metric.ariaLabel ?? [metric.label, metric.value, metric.hint].filter(Boolean).join(' ')
              : metric.ariaLabel
          }
          onClick={metric.onClick}
          style={{
            flex: '1 1 42%',
            minHeight: metric.onClick ? '44px' : undefined,
            minWidth: '118px',
            padding: '10px 0',
            borderBottom: `1px solid ${colors.border}`,
            boxSizing: 'border-box',
          }}
        >
          <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted }}>
            {metric.label}
          </Text>
          <Text
            style={{
              display: 'block',
              marginTop: '4px',
              fontSize: '22px',
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1.15,
            }}
          >
            {metric.value}
          </Text>
          {metric.hint ? (
            <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textSoft }}>
              {metric.hint}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  )
}

export function FlatList(props: FlatListProps) {
  return (
    <View
      style={{
        borderTop: `1px solid ${colors.border}`,
        ...props.style,
      }}
    >
      {props.children}
    </View>
  )
}

export function FlatListRow(props: FlatListRowProps) {
  return (
    <View
      style={{
        minHeight: '44px',
        padding: '10px 0',
        borderBottom: `1px solid ${colors.border}`,
        boxSizing: 'border-box',
        ...props.style,
      }}
    >
      {props.children}
    </View>
  )
}

export function FlatSection(props: FlatSectionProps) {
  return (
    <View style={props.style}>
      <View
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '8px',
        }}
      >
        <Text style={{ color: colors.text, fontSize: '16px', fontWeight: 600 }}>{props.title}</Text>
        {props.extra ? <View>{props.extra}</View> : null}
      </View>
      <View style={{ color: colors.text, ...props.contentStyle }}>{props.children}</View>
    </View>
  )
}
