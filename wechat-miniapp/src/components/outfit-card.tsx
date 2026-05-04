import { Text, View } from '@tarojs/components'

import { formatOccasionLabel, formatOutfitSourceLabel, formatOutfitStatusLabel } from '../lib/display'
import type { Outfit, Pairing } from '../services/types'
import { OutfitImageGrid } from './outfit-image-grid'
import { UIBadge } from './ui-badge'
import { colors } from './ui-theme'

type OutfitCardProps = {
  outfit: Outfit | Pairing
  badge?: string
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
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        boxSizing: 'border-box',
      }}
    >
      <OutfitImageGrid itemHeightMode='fill' items={props.outfit.items} />
      <View
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '10px',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              display: 'block',
              fontSize: '16px',
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
              marginTop: '6px',
              fontSize: '12px',
              color: colors.textMuted,
            }}
          >
            {formatOutfitStatusLabel(props.outfit.status)}
            {props.outfit.scheduled_for ? ` · ${props.outfit.scheduled_for}` : ''}
          </Text>
        </View>
        <UIBadge label={props.badge || formatOutfitSourceLabel(props.outfit.source)} tone={badgeTone} />
      </View>
      {props.outfit.reasoning ? (
        <Text
          style={{
            display: 'block',
            marginTop: '8px',
            fontSize: '13px',
            color: colors.textMuted,
            lineHeight: 1.5,
          }}
        >
          {props.outfit.reasoning}
        </Text>
      ) : null}
    </View>
  )
}
