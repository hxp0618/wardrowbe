import { Button, Input, Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { OutfitCard } from '../../components/outfit-card'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useItems } from '../../hooks/use-items'
import { useCreateManualOutfit, useOutfits } from '../../hooks/use-outfits'

const OCCASION_OPTIONS = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const STATUS_OPTIONS = ['全部状态', 'pending', 'accepted', 'rejected', 'viewed']

export default function OutfitsPage() {
  const canRender = useAuthGuard()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusIndex, setStatusIndex] = useState(0)
  const [manualOccasionIndex, setManualOccasionIndex] = useState(0)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const status = statusIndex === 0 ? undefined : STATUS_OPTIONS[statusIndex]
  const { data, isLoading } = useOutfits(
    {
      status,
      search: search || undefined,
    },
    page,
    20
  )
  const { data: recentItems } = useItems(
    {
      is_archived: false,
      sort_by: 'created_at',
      sort_order: 'desc',
    },
    1,
    12
  )
  const createManualOutfit = useCreateManualOutfit()

  if (!canRender) {
    return null
  }

  const toggleItem = (itemId: string) => {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    )
  }

  const handleCreateManualOutfit = async () => {
    if (selectedItemIds.length === 0) {
      void Taro.showToast({ title: '请先选择单品', icon: 'none' })
      return
    }

    try {
      await createManualOutfit.mutateAsync({
        item_ids: selectedItemIds,
        occasion: OCCASION_OPTIONS[manualOccasionIndex],
        use_for_learning: true,
      })
      setSelectedItemIds([])
      void Taro.showToast({ title: '手动穿搭已创建', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell title='穿搭' subtitle='先交付穿搭列表主链路，支持状态过滤、搜索和分页。'>
      <SectionCard title='手动穿搭'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Picker
            mode='selector'
            range={OCCASION_OPTIONS}
            value={manualOccasionIndex}
            onChange={(event) => setManualOccasionIndex(Number(event.detail.value))}
          >
            <View
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5E7EB',
              }}
            >
              <Text style={{ fontSize: '22px', color: '#111827' }}>
                场景：{OCCASION_OPTIONS[manualOccasionIndex]}
              </Text>
            </View>
          </Picker>
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {(recentItems?.items ?? []).map((item) => {
              const selected = selectedItemIds.includes(item.id)
              return (
                <View
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '999px',
                    border: selected ? '1px solid #0F172A' : '1px solid #CBD5E1',
                    backgroundColor: selected ? '#E2E8F0' : '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: '20px', color: '#111827' }}>
                    {item.name || item.type}
                  </Text>
                </View>
              )
            })}
          </View>
          <Text style={{ fontSize: '20px', color: '#6B7280' }}>已选 {selectedItemIds.length} 件单品</Text>
          <Button onClick={handleCreateManualOutfit} loading={createManualOutfit.isPending}>
            创建手动穿搭
          </Button>
        </View>
      </SectionCard>

      <SectionCard title='筛选'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            value={search}
            placeholder='搜索穿搭名称或场景'
            onInput={(event) => {
              setSearch(event.detail.value)
              setPage(1)
            }}
            style={{
              width: '100%',
              height: '44px',
              padding: '0 14px',
              borderRadius: '14px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E5E7EB',
              boxSizing: 'border-box',
            }}
          />
          <Picker
            mode='selector'
            range={STATUS_OPTIONS}
            value={statusIndex}
            onChange={(event) => {
              setStatusIndex(Number(event.detail.value))
              setPage(1)
            }}
          >
            <View
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5E7EB',
              }}
            >
              <Text style={{ fontSize: '22px', color: '#111827' }}>{STATUS_OPTIONS[statusIndex]}</Text>
            </View>
          </Picker>
        </View>
      </SectionCard>

      <SectionCard title='穿搭列表' extra={<Text style={{ fontSize: '20px', color: '#6B7280' }}>{data?.total ?? 0} 套</Text>}>
        {isLoading ? (
          <Text style={{ fontSize: '22px', color: '#6B7280' }}>正在加载穿搭...</Text>
        ) : data?.outfits?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.outfits.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
            {data.has_more ? <Button onClick={() => setPage((current) => current + 1)}>加载更多</Button> : null}
          </View>
        ) : (
          <EmptyState title='还没有穿搭记录' description='推荐接受、手动穿搭或 Pairings 生成的结果，都会汇总到这里。' />
        )}
      </SectionCard>
    </PageShell>
  )
}
