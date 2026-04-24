import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { EmptyState } from '../../components/empty-state'
import { OutfitCard } from '../../components/outfit-card'
import { OutfitDetailSheet } from '../../components/outfit-detail-sheet'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useOutfits } from '../../hooks/use-outfits'
import { useI18n } from '../../lib/i18n'

import type { Outfit, OutfitFilters } from '../../services/types'

type FilterChip = 'all' | 'my-looks' | 'worn' | 'pairings' | 'ai'

const CHIPS: { key: FilterChip; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'my-looks', label: '我的穿搭' },
  { key: 'worn', label: '已穿' },
  { key: 'pairings', label: '搭配' },
  { key: 'ai', label: 'AI 推荐' },
]

function chipToFilters(chip: FilterChip): OutfitFilters {
  switch (chip) {
    case 'my-looks': return { is_lookbook: true }
    case 'worn': return { is_lookbook: false, status: 'accepted' }
    case 'pairings': return { has_source_item: true }
    case 'ai': return { source: 'scheduled,on_demand' }
    case 'all': default: return {}
  }
}

export default function OutfitsPage() {
  const canRender = useAuthGuard()
  const [activeChip, setActiveChip] = useState<FilterChip>('all')
  const [page, setPage] = useState(1)
  const [detailOutfit, setDetailOutfit] = useState<Outfit | null>(null)
  const { t } = useI18n()
  const filters = chipToFilters(activeChip)
  const { data, isLoading } = useOutfits(filters, page, 20)

  if (!canRender) return null

  const outfits = data?.outfits ?? []

  return (
    <PageShell title={t('page_outfits_title')} subtitle={t('page_outfits_subtitle')} navKey='outfits' useBuiltInTabBar>
      {/* Filter chips */}
      <View style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '4px' }}>
        {CHIPS.map((chip) => (
          <View
            key={chip.key}
            onClick={() => { setActiveChip(chip.key); setPage(1) }}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              border: activeChip === chip.key ? `2px solid ${colors.borderStrong}` : `1px solid ${colors.border}`,
              backgroundColor: activeChip === chip.key ? colors.surfaceSelected : colors.surfaceMuted,
            }}
          >
            <Text style={{
              fontSize: '13px',
              color: activeChip === chip.key ? colors.text : colors.textMuted,
              fontWeight: activeChip === chip.key ? 600 : 400,
            }}>
              {chip.label}
            </Text>
          </View>
        ))}
        {data && (
          <Text style={{ fontSize: '12px', color: colors.textMuted, alignSelf: 'center', marginLeft: 'auto' }}>
            共 {data.total} 套
          </Text>
        )}
      </View>

      {/* Outfit list */}
      {isLoading ? (
        <SectionCard title={t('outfits_loading_title')}>
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('outfits_loading')}</Text>
        </SectionCard>
      ) : outfits.length === 0 ? (
        <EmptyState
          title={t('outfits_empty_title')}
          description={activeChip === 'my-looks' ? t('outfits_empty_description_my_looks') : t('outfits_empty_description_default')}
          action={
            <View
              onClick={() => Taro.switchTab({ url: '/pages/suggest/index' })}
              style={primaryButtonStyle}
            >
              <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
                {t('outfits_get_suggestion')}
              </Text>
            </View>
          }
        />
      ) : (
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {outfits.map((outfit) => (
            <View key={outfit.id} onClick={() => setDetailOutfit(outfit)}>
              <OutfitCard outfit={outfit} />
            </View>
          ))}
          {data?.has_more && (
            <View onClick={() => setPage((p) => p + 1)} style={secondaryButtonStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{t('outfits_load_more')}</Text>
            </View>
          )}
        </View>
      )}

      <OutfitDetailSheet outfit={detailOutfit} visible={!!detailOutfit} onClose={() => setDetailOutfit(null)} />
    </PageShell>
  )
}
