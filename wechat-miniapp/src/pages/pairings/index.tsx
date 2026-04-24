import { Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { OutfitCard } from '../../components/outfit-card'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, inputStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useItemTypes } from '../../hooks/use-items'
import { useGeneratePairings, usePairings } from '../../hooks/use-pairings'
import { formatItemTypeLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'

export default function PairingsPage() {
  const canRender = useAuthGuard()
  const { t, tf } = useI18n()
  const [page, setPage] = useState(1)
  const [typeIndex, setTypeIndex] = useState(0)
  const { data: itemTypes } = useItemTypes()
  const generatePairings = useGeneratePairings()
  const typeOptions = [t('pairings_all_sources'), ...(itemTypes ?? []).map((item) => item.type)]
  const sourceType = typeIndex === 0 ? undefined : typeOptions[typeIndex]
  const { data, isLoading } = usePairings(page, 20, sourceType)

  if (!canRender) return null

  const handleGenerate = async () => {
    try {
      const result = await generatePairings.mutateAsync({ num_pairings: 5 })
      void Taro.showToast({ title: tf('pairings_toast_generated', { count: result.generated }), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pairings_generate_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell
      title={t('page_pairings_title')}
      subtitle={t('page_pairings_subtitle')}
      navKey='suggest'
      actions={
        <View onClick={handleGenerate} style={{ ...primaryButtonStyle, minHeight: '40px', padding: '10px 14px', opacity: generatePairings.isPending ? 0.7 : 1 }}>
          <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
            {generatePairings.isPending ? t('pairings_generating') : t('pairings_generate')}
          </Text>
        </View>
      }
    >
      <SectionCard title={t('pairings_filter_title')}>
        <Picker mode='selector' range={typeOptions} value={typeIndex} onChange={(event) => { setTypeIndex(Number(event.detail.value)); setPage(1) }}>
          <View style={inputStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>
              {typeIndex === 0 ? typeOptions[typeIndex] : formatItemTypeLabel(typeOptions[typeIndex])}
            </Text>
          </View>
        </Picker>
      </SectionCard>

      <SectionCard title={t('pairings_list_title')} extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{tf('pairings_count', { count: data?.total ?? 0 })}</Text>}>
        {isLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('pairings_loading')}</Text>
        ) : data?.pairings?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.pairings.map((pairing) => (
              <OutfitCard
                key={pairing.id}
                outfit={pairing}
                badge={pairing.source_item?.type ? formatItemTypeLabel(pairing.source_item.type) : pairing.source}
              />
            ))}
            {data.has_more ? (
              <View onClick={() => setPage((current) => current + 1)} style={secondaryButtonStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{t('pairings_load_more')}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <EmptyState title={t('pairings_empty_title')} description={t('pairings_empty_description')} />
        )}
      </SectionCard>
    </PageShell>
  )
}
