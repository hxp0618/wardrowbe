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

export default function PairingsPage() {
  const canRender = useAuthGuard()
  const [page, setPage] = useState(1)
  const [typeIndex, setTypeIndex] = useState(0)
  const { data: itemTypes } = useItemTypes()
  const generatePairings = useGeneratePairings()
  const typeOptions = ['全部来源', ...(itemTypes ?? []).map((item) => item.type)]
  const sourceType = typeIndex === 0 ? undefined : typeOptions[typeIndex]
  const { data, isLoading } = usePairings(page, 20, sourceType)

  if (!canRender) return null

  const handleGenerate = async () => {
    try {
      const result = await generatePairings.mutateAsync({ num_pairings: 5 })
      void Taro.showToast({ title: `已生成 ${result.generated} 套搭配`, icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell
      title='搭配'
      subtitle='AI 生成的单品搭配'
      navKey='suggest'
      actions={
        <View onClick={handleGenerate} style={{ ...primaryButtonStyle, minHeight: '40px', padding: '10px 14px', opacity: generatePairings.isPending ? 0.7 : 1 }}>
          <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
            {generatePairings.isPending ? '生成中...' : '生成搭配'}
          </Text>
        </View>
      }
    >
      <SectionCard title='筛选'>
        <Picker mode='selector' range={typeOptions} value={typeIndex} onChange={(event) => { setTypeIndex(Number(event.detail.value)); setPage(1) }}>
          <View style={inputStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>
              {formatItemTypeLabel(typeOptions[typeIndex])}
            </Text>
          </View>
        </Picker>
      </SectionCard>

      <SectionCard title='搭配列表' extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{data?.total ?? 0} 套</Text>}>
        {isLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>正在加载搭配...</Text>
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
                <Text style={{ fontSize: '14px', color: colors.text }}>加载更多</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <EmptyState title='还没有搭配结果' description='点击上方"生成搭配"让 AI 为你推荐单品组合。' />
        )}
      </SectionCard>
    </PageShell>
  )
}
