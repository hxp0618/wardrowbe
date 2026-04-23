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
  const filters = chipToFilters(activeChip)
  const { data, isLoading } = useOutfits(filters, page, 20)

  if (!canRender) return null

  const outfits = data?.outfits ?? []

  return (
    <PageShell title='穿搭' subtitle='查看、筛选和管理你的穿搭记录' navKey='outfits' useBuiltInTabBar>
      {/* Filter chips */}
      <View style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '4px' }}>
        {CHIPS.map((chip) => (
          <View
            key={chip.key}
            onClick={() => { setActiveChip(chip.key); setPage(1) }}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              border: activeChip === chip.key ? '2px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.08)',
              backgroundColor: activeChip === chip.key ? '#27272a' : '#17171c',
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
        <SectionCard title='加载中'>
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>正在加载穿搭...</Text>
        </SectionCard>
      ) : outfits.length === 0 ? (
        <EmptyState
          title='还没有穿搭'
          description={activeChip === 'my-looks' ? '去推荐页创建你的第一套穿搭' : '当有更多穿搭记录后，这里会显示'}
          action={
            <View
              onClick={() => Taro.switchTab({ url: '/pages/suggest/index' })}
              style={primaryButtonStyle}
            >
              <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
                去获取推荐
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
              <Text style={{ fontSize: '14px', color: colors.text }}>加载更多</Text>
            </View>
          )}
        </View>
      )}

      <OutfitDetailSheet outfit={detailOutfit} visible={!!detailOutfit} onClose={() => setDetailOutfit(null)} />
    </PageShell>
  )
}
