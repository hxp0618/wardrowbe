import type { CSSProperties } from 'react'

import { Text, View } from '@tarojs/components'

import { formatItemTypeLabel } from '../lib/display'
import { getDisplayImageUrl, getOutfitPreviewUrls, getPreviewImageUrl } from '../lib/image-preview'
import { PreviewableImage } from './previewable-image'
import { colors } from './ui-theme'

type OutfitGridItem = {
  id: string
  type: string
  name?: string | null
  image_url?: string | null
  medium_url?: string | null
  thumbnail_url?: string | null
  image_path?: string | null
  medium_path?: string | null
  thumbnail_path?: string | null
}

type OutfitImageGridProps = {
  emptyLabel?: string
  imageAriaLabel?: (label: string) => string
  itemHeightMode?: 'fixed' | 'fill'
  items: OutfitGridItem[]
  style?: CSSProperties
}

export function OutfitImageGrid(props: OutfitImageGridProps) {
  const visualItems = props.items.slice(0, 4)
  const previewUrls = getOutfitPreviewUrls(props.items)
  const imageAriaLabel = props.imageAriaLabel ?? ((label: string) => `查看${label}大图`)
  const itemHeightMode = props.itemHeightMode ?? 'fixed'

  return (
    <View
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2px',
        height: '172px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: colors.surfaceMuted,
        ...props.style,
      }}
    >
      {visualItems.length > 0 ? visualItems.map((item) => {
        const imageUrl = getDisplayImageUrl(item)
        const previewUrl = getPreviewImageUrl(item)
        const imageLabel = item.name || formatItemTypeLabel(item.type)
        const itemWidth = visualItems.length === 1 ? '100%' : 'calc(50% - 1px)'
        const itemHeight = visualItems.length <= 2 && itemHeightMode === 'fill' ? '100%' : visualItems.length <= 2 ? '172px' : '85px'

        return (
          <View
            key={item.id}
            style={{
              width: itemWidth,
              height: itemHeight,
              backgroundColor: colors.surfaceMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {imageUrl ? (
              <PreviewableImage
                ariaLabel={imageAriaLabel(imageLabel)}
                src={imageUrl}
                previewCurrent={previewUrl ?? imageUrl}
                previewUrls={previewUrls.length ? previewUrls : [previewUrl ?? imageUrl]}
                mode='aspectFill'
                style={{ width: '100%', height: itemHeight, backgroundColor: colors.surfaceMuted }}
              />
            ) : (
              <View style={{ width: '100%', height: itemHeight, backgroundColor: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '12px', color: colors.textMuted }}>{formatItemTypeLabel(item.type)}</Text>
              </View>
            )}
          </View>
        )
      }) : (
        <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: '12px', color: colors.textSoft }}>{props.emptyLabel ?? '暂无图片'}</Text>
        </View>
      )}
    </View>
  )
}
