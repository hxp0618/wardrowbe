import type { CSSProperties } from 'react'

import { Text, View } from '@tarojs/components'

import { formatItemTypeLabel, formatSubtypeLabel } from '../lib/display'
import { getDisplayImageUrl, getItemPreviewUrls, getPreviewImageUrl } from '../lib/image-preview'
import type { Item } from '../services/types'
import { PreviewableImage } from './previewable-image'
import { UIBadge } from './ui-badge'
import { colors } from './ui-theme'

type ItemCardProps = {
  item: Item
  style?: CSSProperties
  variant?: 'default' | 'wardrobe'
}

export function ItemCard(props: ItemCardProps) {
  const imageUrl = getDisplayImageUrl(props.item)
  const previewUrl = getPreviewImageUrl(props.item)
  const previewUrls = getItemPreviewUrls(props.item)
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
  const mediaStyle: CSSProperties = wardrobeVariant
    ? {
        width: '100%',
        height: '172px',
        borderRadius: '8px 8px 6px 6px',
        backgroundColor: colors.surfaceMuted,
        flexShrink: 0,
      }
    : {
        width: '88px',
        height: '104px',
        borderRadius: '8px',
        backgroundColor: colors.surfaceMuted,
        flexShrink: 0,
      }

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: wardrobeVariant ? 'column' : 'row',
        gap: wardrobeVariant ? '0' : '12px',
        padding: wardrobeVariant ? '0' : '14px',
        borderRadius: '8px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...props.style,
      }}
    >
      {imageUrl ? (
        <PreviewableImage
          ariaLabel={`查看${title}大图`}
          src={imageUrl}
          previewCurrent={previewUrl ?? imageUrl}
          previewUrls={previewUrls.length ? previewUrls : [previewUrl ?? imageUrl]}
          mode='aspectFill'
          style={mediaStyle}
        />
      ) : (
        <View
          style={{
            ...mediaStyle,
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
      <View
        style={{
          flex: 1,
          padding: wardrobeVariant ? '9px 10px 11px' : '0',
          minHeight: wardrobeVariant ? '78px' : undefined,
          boxSizing: 'border-box',
        }}
      >
        <Text
          style={{
            display: 'block',
            fontSize: wardrobeVariant ? '14px' : '16px',
            fontWeight: 600,
            color: colors.text,
            lineHeight: 1.3,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={{
            display: 'block',
            marginTop: wardrobeVariant ? '4px' : '6px',
            fontSize: wardrobeVariant ? '11px' : '12px',
            color: colors.textMuted,
          }}
          numberOfLines={1}
        >
          {typeLabel}
          {subtypeLabel ? ` · ${subtypeLabel}` : ''}
        </Text>
        <Text
          style={{
            display: 'block',
            marginTop: wardrobeVariant ? '5px' : '7px',
            fontSize: wardrobeVariant ? '10px' : '12px',
            color: colors.textSoft,
          }}
        >
          {copy.quantityWear}
        </Text>
        <View
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: wardrobeVariant ? '5px' : '8px',
            marginTop: wardrobeVariant ? '6px' : '9px',
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
