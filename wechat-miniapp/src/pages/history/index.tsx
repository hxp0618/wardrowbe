import { Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo, useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { OutfitCard } from '../../components/outfit-card'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, inputStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useCalendarOutfits } from '../../hooks/use-outfits'
import { formatOccasionLabel } from '../../lib/display'

const OCCASIONS = ['全部场景', 'casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const STATUSES = ['全部状态', 'pending', 'accepted', 'rejected', 'viewed']
const STATUS_LABELS: Record<string, string> = {
  pending: '待确认',
  accepted: '已接受',
  rejected: '已拒绝',
  viewed: '已查看',
}

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

function sortOutfitsByDate<T extends { scheduled_for: string | null; created_at: string }>(outfits: T[]): T[] {
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
    <PageShell title='历史' subtitle='按日期浏览穿搭记录' navKey='dashboard'>
      <SectionCard title='筛选'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Picker mode='date' fields='month' value={monthValue} onChange={(event) => setMonthValue(event.detail.value)}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>月份：{monthValue}</Text>
            </View>
          </Picker>
          <Picker mode='selector' range={OCCASIONS} value={occasionIndex} onChange={(event) => setOccasionIndex(Number(event.detail.value))}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>
                {formatOccasionLabel(OCCASIONS[occasionIndex])}
              </Text>
            </View>
          </Picker>
          <Picker mode='selector' range={STATUSES} value={statusIndex} onChange={(event) => setStatusIndex(Number(event.detail.value))}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>
                {STATUS_LABELS[STATUSES[statusIndex]] ?? STATUSES[statusIndex]}
              </Text>
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
                    border: selected ? `1px solid ${colors.borderStrong}` : `1px solid ${colors.border}`,
                    backgroundColor: selected ? colors.surfaceSelected : colors.surfaceMuted,
                  }}
                >
                  <Text style={{ fontSize: '12px', color: selected ? colors.text : colors.textMuted }}>{date}</Text>
                </View>
              )
            })}
          </View>
        ) : (
          <EmptyState title='这个月还没有历史记录' description='接受推荐或创建穿搭后，历史记录会按日期聚合到这里。' />
        )}
      </SectionCard>

      <SectionCard title='当日记录' extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{selectedDate}</Text>}>
        {isLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>正在加载历史记录...</Text>
        ) : selectedOutfits.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedOutfits.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </View>
        ) : (
          <EmptyState
            title='所选日期没有记录'
            description='切换其它日期，或者先去推荐页接受一套新的穿搭。'
            action={
              <View
                onClick={() => void Taro.switchTab({ url: '/pages/suggest/index' })}
                style={secondaryButtonStyle}
              >
                <Text style={{ fontSize: '14px', color: colors.text }}>去推荐页</Text>
              </View>
            }
          />
        )}
        <View style={{ marginTop: '12px' }}>
          <View onClick={() => setSelectedDate(toDateString(new Date()))} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>回到今天</Text>
          </View>
        </View>
      </SectionCard>
    </PageShell>
  )
}
