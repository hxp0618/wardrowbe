import { Text, View } from '@tarojs/components'

type StatCardProps = {
  label: string
  value: string
  hint?: string
}

export function StatCard(props: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: '140px',
        padding: '18px',
        borderRadius: '18px',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E5E7EB',
      }}
    >
      <Text
        style={{
          display: 'block',
          fontSize: '22px',
          color: '#6B7280',
        }}
      >
        {props.label}
      </Text>
      <Text
        style={{
          display: 'block',
          marginTop: '8px',
          fontSize: '34px',
          fontWeight: 700,
          color: '#0F172A',
        }}
      >
        {props.value}
      </Text>
      {props.hint ? (
        <Text
          style={{
            display: 'block',
            marginTop: '8px',
            fontSize: '20px',
            color: '#6B7280',
          }}
        >
          {props.hint}
        </Text>
      ) : null}
    </View>
  )
}
