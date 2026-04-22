import { Image, Text, View } from '@tarojs/components'

import type { Item } from '../services/types'

type ItemCardProps = {
  item: Item
}

export function ItemCard(props: ItemCardProps) {
  const imageUrl = props.item.thumbnail_url ?? props.item.image_url
  const title = props.item.name || props.item.type

  return (
    <View
      style={{
        display: 'flex',
        gap: '16px',
        padding: '18px',
        borderRadius: '18px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          mode='aspectFill'
          style={{
            width: '112px',
            height: '112px',
            borderRadius: '16px',
            backgroundColor: '#E5E7EB',
            flexShrink: 0,
          }}
        />
      ) : (
        <View
          style={{
            width: '112px',
            height: '112px',
            borderRadius: '16px',
            backgroundColor: '#E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: '22px', color: '#6B7280' }}>{props.item.type}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            display: 'block',
            fontSize: '26px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            display: 'block',
            marginTop: '8px',
            fontSize: '22px',
            color: '#6B7280',
          }}
        >
          {props.item.type}
          {props.item.subtype ? ` · ${props.item.subtype}` : ''}
        </Text>
        <Text
          style={{
            display: 'block',
            marginTop: '8px',
            fontSize: '22px',
            color: '#6B7280',
          }}
        >
          数量 {props.item.quantity} · 穿过 {props.item.wear_count} 次
        </Text>
        {props.item.needs_wash ? (
          <Text
            style={{
              display: 'block',
              marginTop: '8px',
              fontSize: '22px',
              color: '#B45309',
            }}
          >
            需要清洗
          </Text>
        ) : null}
      </View>
    </View>
  )
}
