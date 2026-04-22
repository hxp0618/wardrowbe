import { Text, View } from '@tarojs/components'

type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState(props: EmptyStateProps) {
  return (
    <View
      style={{
        padding: '20px',
        borderRadius: '16px',
        backgroundColor: '#F9FAFB',
      }}
    >
      <Text
        style={{
          display: 'block',
          fontSize: '24px',
          fontWeight: 600,
          color: '#111827',
        }}
      >
        {props.title}
      </Text>
      <Text
        style={{
          display: 'block',
          marginTop: '8px',
          fontSize: '22px',
          color: '#6B7280',
          lineHeight: 1.5,
        }}
      >
        {props.description}
      </Text>
    </View>
  )
}
