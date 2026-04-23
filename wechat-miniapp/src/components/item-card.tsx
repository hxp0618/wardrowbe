import { Image, Text, View } from '@tarojs/components'

import { formatItemTypeLabel, formatSubtypeLabel } from '../lib/display'
import type { Item } from '../services/types'
import { UIBadge } from './ui-badge'
import { colors } from './ui-theme'

type ItemCardProps = {
  item: Item
}

export function ItemCard(props: ItemCardProps) {
  const imageUrl = props.item.thumbnail_url ?? props.item.image_url
  const typeLabel = formatItemTypeLabel(props.item.type)
  const subtypeLabel = formatSubtypeLabel(props.item.subtype)
  const title = props.item.name || typeLabel

  return (
    <View
      style={{
        display: 'flex',
        gap: '14px',
        padding: '16px',
        borderRadius: '18px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          mode='aspectFill'
          style={{
            width: '96px',
            height: '112px',
            borderRadius: '14px',
            backgroundColor: colors.surfaceMuted,
            flexShrink: 0,
          }}
        />
      ) : (
        <View
          style={{
            width: '96px',
            height: '112px',
            borderRadius: '14px',
            backgroundColor: colors.surfaceMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: '13px', color: colors.textSoft }}>{typeLabel}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            display: 'block',
            fontSize: '17px',
            fontWeight: 600,
            color: colors.text,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            display: 'block',
            marginTop: '6px',
            fontSize: '12px',
            color: colors.textMuted,
          }}
        >
          {typeLabel}
          {subtypeLabel ? ` · ${subtypeLabel}` : ''}
        </Text>
        <Text
          style={{
            display: 'block',
            marginTop: '8px',
            fontSize: '12px',
            color: colors.textSoft,
          }}
        >
          数量 {props.item.quantity} · 穿过 {props.item.wear_count} 次
        </Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          {props.item.favorite ? <UIBadge label='收藏' tone='danger' /> : null}
          {props.item.needs_wash ? <UIBadge label='需要清洗' tone='warning' /> : null}
          {props.item.is_archived ? <UIBadge label='已归档' /> : null}
        </View>
      </View>
    </View>
  )
}
