import type { CSSProperties } from 'react'

import { Image, Text, View } from '@tarojs/components'

import { formatItemTypeLabel, formatSubtypeLabel } from '../lib/display'
import type { Item } from '../services/types'
import { UIBadge } from './ui-badge'
import { colors } from './ui-theme'

type ItemCardProps = {
  item: Item
  style?: CSSProperties
  variant?: 'default' | 'wardrobe'
}

export function ItemCard(props: ItemCardProps) {
  const imageUrl = props.item.thumbnail_url ?? props.item.image_url
  const typeLabel = formatItemTypeLabel(props.item.type)
  const subtypeLabel = formatSubtypeLabel(props.item.subtype)
  const title = props.item.name || typeLabel
  const wardrobeVariant = props.variant === 'wardrobe'
  const copy = {
    quantityWear: `数量 ${props.item.quantity} · 穿过 ${props.item.wear_count} 次`,
    favorite: '收藏',
    needsWash: '需要清洗',
    archived: '已归档',
  }

  return (
    <View
      style={{
        display: 'flex',
        gap: wardrobeVariant ? '12px' : '14px',
        padding: wardrobeVariant ? '12px' : '16px',
        borderRadius: wardrobeVariant ? '22px' : '18px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        ...props.style,
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          mode='aspectFill'
          style={{
            width: wardrobeVariant ? '104px' : '96px',
            height: wardrobeVariant ? '128px' : '112px',
            borderRadius: wardrobeVariant ? '16px' : '14px',
            backgroundColor: colors.surfaceMuted,
            flexShrink: 0,
          }}
        />
      ) : (
        <View
          style={{
            width: wardrobeVariant ? '104px' : '96px',
            height: wardrobeVariant ? '128px' : '112px',
            borderRadius: wardrobeVariant ? '16px' : '14px',
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
            fontSize: wardrobeVariant ? '16px' : '17px',
            fontWeight: 600,
            color: colors.text,
            lineHeight: 1.3,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            display: 'block',
            marginTop: wardrobeVariant ? '4px' : '6px',
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
            marginTop: wardrobeVariant ? '6px' : '8px',
            fontSize: wardrobeVariant ? '11px' : '12px',
            color: colors.textSoft,
          }}
        >
          {copy.quantityWear}
        </Text>
        <View
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: wardrobeVariant ? '6px' : '8px',
            marginTop: wardrobeVariant ? '8px' : '10px',
          }}
        >
          {props.item.favorite ? <UIBadge label={copy.favorite} tone='danger' /> : null}
          {props.item.needs_wash ? <UIBadge label={copy.needsWash} tone='warning' /> : null}
          {props.item.is_archived ? <UIBadge label={copy.archived} /> : null}
        </View>
      </View>
    </View>
  )
}
