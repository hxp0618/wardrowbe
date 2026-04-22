import { Button, Picker, Text, View } from '@tarojs/components'
import { useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { OutfitCard } from '../../components/outfit-card'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useItemTypes } from '../../hooks/use-items'
import { usePairings } from '../../hooks/use-pairings'

export default function PairingsPage() {
  const canRender = useAuthGuard()
  const [page, setPage] = useState(1)
  const [typeIndex, setTypeIndex] = useState(0)
  const { data: itemTypes } = useItemTypes()
  const typeOptions = ['全部来源', ...(itemTypes ?? []).map((item) => item.type)]
  const sourceType = typeIndex === 0 ? undefined : typeOptions[typeIndex]
  const { data, isLoading } = usePairings(page, 20, sourceType)

  if (!canRender) {
    return null
  }

  return (
    <PageShell title='搭配' subtitle='这里先复用 `/pairings` 列表能力，按来源单品类型筛选和分页。'>
      <SectionCard title='筛选'>
        <Picker
          mode='selector'
          range={typeOptions}
          value={typeIndex}
          onChange={(event) => {
            setTypeIndex(Number(event.detail.value))
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
            <Text style={{ fontSize: '22px', color: '#111827' }}>{typeOptions[typeIndex]}</Text>
          </View>
        </Picker>
      </SectionCard>

      <SectionCard title='搭配列表' extra={<Text style={{ fontSize: '20px', color: '#6B7280' }}>{data?.total ?? 0} 套</Text>}>
        {isLoading ? (
          <Text style={{ fontSize: '22px', color: '#6B7280' }}>正在加载搭配...</Text>
        ) : data?.pairings?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.pairings.map((pairing) => (
              <OutfitCard
                key={pairing.id}
                outfit={pairing}
                badge={pairing.source_item?.type || pairing.source}
              />
            ))}
            {data.has_more ? <Button onClick={() => setPage((current) => current + 1)}>加载更多</Button> : null}
          </View>
        ) : (
          <EmptyState title='还没有搭配结果' description='衣橱积累更多单品后，Pairings 接口返回的组合会出现在这里。' />
        )}
      </SectionCard>
    </PageShell>
  )
}
