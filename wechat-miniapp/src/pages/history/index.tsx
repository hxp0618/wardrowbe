import { Button, Picker, Text, View } from '@tarojs/components'
import { useMemo, useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { OutfitCard } from '../../components/outfit-card'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useCalendarOutfits } from '../../hooks/use-outfits'

const OCCASIONS = ['全部场景', 'casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const STATUSES = ['全部状态', 'pending', 'accepted', 'rejected', 'viewed']

function currentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function sortOutfitsByDate(outfits: Array<{ scheduled_for: string | null; created_at: string }>) {
  return [...outfits].sort((left, right) => {
    const leftKey = left.scheduled_for ?? left.created_at
    const rightKey = right.scheduled_for ?? right.created_at
    return rightKey.localeCompare(leftKey)
  })
}

export default function HistoryPage() {
  const canRender = useAuthGuard()
  const { year: currentYear, month: currentMonth } = useMemo(() => currentYearMonth(), [])
  const [monthValue, setMonthValue] = useState(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)
  const [occasionIndex, setOccasionIndex] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string>(toDateString(new Date()))
  const [year, month] = monthValue.split('-').map(Number)
  const occasion = occasionIndex === 0 ? undefined : OCCASIONS[occasionIndex]
  const status = statusIndex === 0 ? undefined : STATUSES[statusIndex]
  const { data, isLoading } = useCalendarOutfits(year, month, {
    occasion,
    status,
  })

  if (!canRender) {
    return null
  }

  const outfits = data?.outfits ?? []
  const selectedOutfits = sortOutfitsByDate(
    outfits.filter((outfit) => outfit.scheduled_for === selectedDate)
  )
  const groupedDates = Array.from(
    new Set(
      sortOutfitsByDate(outfits)
        .map((outfit) => outfit.scheduled_for)
        .filter((date): date is string => Boolean(date))
    )
  )

  return (
    <PageShell title='历史' subtitle='移动端先用日期列表替代桌面双栏日历，保持历史浏览和筛选可用。'>
      <SectionCard title='筛选'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Picker mode='date' fields='month' value={monthValue} onChange={(event) => setMonthValue(event.detail.value)}>
            <View
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5E7EB',
              }}
            >
              <Text style={{ fontSize: '22px', color: '#111827' }}>月份：{monthValue}</Text>
            </View>
          </Picker>
          <Picker mode='selector' range={OCCASIONS} value={occasionIndex} onChange={(event) => setOccasionIndex(Number(event.detail.value))}>
            <View
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5E7EB',
              }}
            >
              <Text style={{ fontSize: '22px', color: '#111827' }}>{OCCASIONS[occasionIndex]}</Text>
            </View>
          </Picker>
          <Picker mode='selector' range={STATUSES} value={statusIndex} onChange={(event) => setStatusIndex(Number(event.detail.value))}>
            <View
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5E7EB',
              }}
            >
              <Text style={{ fontSize: '22px', color: '#111827' }}>{STATUSES[statusIndex]}</Text>
            </View>
          </Picker>
        </View>
      </SectionCard>

      <SectionCard title='日期'>
        {groupedDates.length ? (
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {groupedDates.map((date) => {
              const selected = date === selectedDate
              return (
                <View
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '999px',
                    border: selected ? '1px solid #0F172A' : '1px solid #CBD5E1',
                    backgroundColor: selected ? '#E2E8F0' : '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: '20px', color: '#111827' }}>{date}</Text>
                </View>
              )
            })}
          </View>
        ) : (
          <EmptyState title='这个月还没有历史记录' description='接受推荐或创建穿搭后，历史记录会按日期聚合到这里。' />
        )}
      </SectionCard>

      <SectionCard title='当日记录' extra={<Text style={{ fontSize: '20px', color: '#6B7280' }}>{selectedDate}</Text>}>
        {isLoading ? (
          <Text style={{ fontSize: '22px', color: '#6B7280' }}>正在加载历史记录...</Text>
        ) : selectedOutfits.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedOutfits.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </View>
        ) : (
          <EmptyState title='所选日期没有记录' description='切换其它日期，或者先去推荐页接受一套新的穿搭。' />
        )}
        <View style={{ marginTop: '12px' }}>
          <Button onClick={() => setSelectedDate(toDateString(new Date()))}>回到今天</Button>
        </View>
      </SectionCard>
    </PageShell>
  )
}
