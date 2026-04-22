import { Image, Text, View } from '@tarojs/components'

import type { Outfit, Pairing } from '../services/types'

type OutfitCardProps = {
  outfit: Outfit | Pairing
  badge?: string
}

function formatStatus(status: string): string {
  switch (status) {
    case 'pending':
      return '待确认'
    case 'accepted':
      return '已接受'
    case 'rejected':
      return '已拒绝'
    case 'viewed':
      return '已查看'
    default:
      return status
  }
}

export function OutfitCard(props: OutfitCardProps) {
  return (
    <View
      style={{
        padding: '18px',
        borderRadius: '18px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
      }}
    >
      <View
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              display: 'block',
              fontSize: '26px',
              fontWeight: 600,
              color: '#111827',
            }}
          >
            {props.outfit.name || props.outfit.occasion}
          </Text>
          <Text
            style={{
              display: 'block',
              marginTop: '6px',
              fontSize: '22px',
              color: '#6B7280',
            }}
          >
            {formatStatus(props.outfit.status)}
            {props.outfit.scheduled_for ? ` · ${props.outfit.scheduled_for}` : ''}
          </Text>
        </View>
        <Text
          style={{
            fontSize: '20px',
            color: '#334155',
            backgroundColor: '#E2E8F0',
            borderRadius: '999px',
            padding: '6px 12px',
          }}
        >
          {props.badge || props.outfit.source}
        </Text>
      </View>
      {props.outfit.reasoning ? (
        <Text
          style={{
            display: 'block',
            marginTop: '12px',
            fontSize: '22px',
            color: '#475569',
            lineHeight: 1.5,
          }}
        >
          {props.outfit.reasoning}
        </Text>
      ) : null}
      <View
        style={{
          display: 'flex',
          gap: '10px',
          marginTop: '16px',
          flexWrap: 'wrap',
        }}
      >
        {props.outfit.items.map((item) => {
          const imageUrl = item.thumbnail_url ?? item.image_url
          return imageUrl ? (
            <Image
              key={item.id}
              src={imageUrl}
              mode='aspectFill'
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '14px',
                backgroundColor: '#E5E7EB',
              }}
            />
          ) : (
            <View
              key={item.id}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '14px',
                backgroundColor: '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: '20px', color: '#6B7280' }}>{item.type}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
