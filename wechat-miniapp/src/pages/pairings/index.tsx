import { Text, View } from '@tarojs/components'
import { useState } from 'react'

import { getActionButtonStyle } from '../../components/action-style'
import { CompactOptionGroup } from '../../components/compact-option-group'
import { EmptyState } from '../../components/empty-state'
import { FlatSection } from '../../components/flat-data'
import { OutfitCard } from '../../components/outfit-card'
import { OutfitDetailSheet } from '../../components/outfit-detail-sheet'
import { PageShell } from '../../components/page-shell'
import { colors } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useItemTypes } from '../../hooks/use-items'
import { usePairings } from '../../hooks/use-pairings'
import { formatItemTypeLabel, formatOutfitDetailLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import type { Outfit } from '../../services/types'

export default function PairingsPage() {
  const canRender = useAuthGuard()
  const { t, tf } = useI18n()
  const [page, setPage] = useState(1)
  const [typeIndex, setTypeIndex] = useState(0)
  const [detailOutfit, setDetailOutfit] = useState<Outfit | null>(null)
  const { data: itemTypes } = useItemTypes()
  const typeOptions = [
    { label: t('pairings_all_sources'), value: undefined as string | undefined },
    ...(itemTypes ?? []).map((item) => ({
      label: formatItemTypeLabel(item.type),
      value: item.type,
    })),
  ]
  const sourceType = typeOptions[typeIndex]?.value
  const { data, isLoading } = usePairings(page, 20, sourceType)

  if (!canRender) return null

  return (
    <PageShell
      title={t('page_pairings_title')}
      subtitle={t('page_pairings_subtitle')}
      navKey='suggest'
    >
      <View style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '2px' }}>
        <Text style={{ fontSize: '13px', fontWeight: 600, color: colors.textMuted }}>
          {t('pairings_filter_title')}
        </Text>
        <CompactOptionGroup
          activeIndex={typeIndex}
          options={typeOptions.map((option) => option.label)}
          onChange={(nextIndex) => {
            setTypeIndex(nextIndex)
            setPage(1)
          }}
        />
      </View>

      <FlatSection title={t('pairings_list_title')} extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{tf('pairings_count', { count: data?.total ?? 0 })}</Text>}>
        {isLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('pairings_loading')}</Text>
        ) : data?.pairings?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.pairings.map((pairing) => (
              <View
                key={pairing.id}
                ariaRole='button'
                ariaLabel={formatOutfitDetailLabel(pairing)}
                onClick={() => setDetailOutfit(pairing)}
              >
                <OutfitCard
                  outfit={pairing}
                  badge={pairing.source_item?.type ? formatItemTypeLabel(pairing.source_item.type) : pairing.source}
                />
              </View>
            ))}
            {data.has_more ? (
              <View ariaRole='button' ariaLabel={t('pairings_load_more')} onClick={() => setPage((current) => current + 1)} style={getActionButtonStyle()}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{t('pairings_load_more')}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <EmptyState embedded title={t('pairings_empty_title')} description={t('pairings_empty_description')} />
        )}
      </FlatSection>
      <OutfitDetailSheet outfit={detailOutfit} visible={!!detailOutfit} onClose={() => setDetailOutfit(null)} />
    </PageShell>
  )
}
