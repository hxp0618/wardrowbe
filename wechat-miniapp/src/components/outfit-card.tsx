import { Image, Text, View } from '@tarojs/components'

import { formatItemTypeLabel, formatOccasionLabel } from '../lib/display'
import type { Outfit, Pairing } from '../services/types'
import { UIBadge } from './ui-badge'
import { colors } from './ui-theme'

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
  const badgeTone =
    props.outfit.status === 'accepted'
      ? 'success'
      : props.outfit.status === 'rejected'
      ? 'danger'
      : props.outfit.status === 'pending'
      ? 'warning'
      : 'default'

  const title = props.outfit.name || formatOccasionLabel(props.outfit.occasion)

  return (
    <View
      style={{
        padding: '16px',
        borderRadius: '18px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
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
          {formatStatus(props.outfit.status)}
          {props.outfit.scheduled_for ? ` · ${props.outfit.scheduled_for}` : ''}
        </Text>
      </View>
        <UIBadge label={props.badge || props.outfit.source} tone={badgeTone} />
      </View>
      {props.outfit.reasoning ? (
        <Text
          style={{
            display: 'block',
            marginTop: '12px',
            fontSize: '13px',
            color: colors.textMuted,
            lineHeight: 1.5,
          }}
        >
          {props.outfit.reasoning}
        </Text>
      ) : null}
      <View
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '14px',
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
                width: '84px',
                height: '84px',
                borderRadius: '12px',
                backgroundColor: colors.surfaceMuted,
              }}
            />
          ) : (
            <View
              key={item.id}
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '12px',
                backgroundColor: colors.surfaceMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: '12px', color: colors.textSoft }}>{formatItemTypeLabel(item.type)}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
