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
import { useI18n } from '../../lib/i18n'

const OCCASION_VALUES = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const STATUS_VALUES = ['pending', 'accepted', 'rejected', 'viewed']

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
  const { t, tf, locale } = useI18n()
  const occasionOptions =
    locale === 'en'
      ? ['All occasions', 'Casual', 'Office', 'Formal', 'Date', 'Sporty', 'Outdoor']
      : ['全部场景', '休闲', '办公', '正式', '约会', '运动', '户外']
  const statusOptions =
    locale === 'en'
      ? ['All statuses', 'Pending', 'Accepted', 'Rejected', 'Viewed']
      : ['全部状态', '待确认', '已接受', '已拒绝', '已查看']
  const loadingText = locale === 'en' ? 'Loading history...' : '正在加载历史记录...'
  const [year, month] = monthValue.split('-').map(Number)
  const occasion = occasionIndex === 0 ? undefined : OCCASION_VALUES[occasionIndex - 1]
  const status = statusIndex === 0 ? undefined : STATUS_VALUES[statusIndex - 1]
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
    <PageShell title={t('page_history_title')} subtitle={t('page_history_subtitle')} navKey='dashboard'>
      <SectionCard title={t('history_filters_title')}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Picker mode='date' fields='month' value={monthValue} onChange={(event) => setMonthValue(event.detail.value)}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{tf('history_month_label', { value: monthValue })}</Text>
            </View>
          </Picker>
          <Picker mode='selector' range={occasionOptions} value={occasionIndex} onChange={(event) => setOccasionIndex(Number(event.detail.value))}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{occasionOptions[occasionIndex]}</Text>
            </View>
          </Picker>
          <Picker mode='selector' range={statusOptions} value={statusIndex} onChange={(event) => setStatusIndex(Number(event.detail.value))}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{statusOptions[statusIndex]}</Text>
            </View>
          </Picker>
        </View>
      </SectionCard>

      <SectionCard title={t('history_dates_title')}>
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
          <EmptyState title={t('history_empty_month_title')} description={t('history_empty_month_description')} />
        )}
      </SectionCard>

      <SectionCard title={t('history_records_title')} extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{selectedDate}</Text>}>
        {isLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{loadingText}</Text>
        ) : selectedOutfits.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedOutfits.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </View>
        ) : (
          <EmptyState
            title={t('history_empty_day_title')}
            description={t('history_empty_day_description')}
            action={
              <View
                onClick={() => void Taro.switchTab({ url: '/pages/suggest/index' })}
                style={secondaryButtonStyle}
              >
                <Text style={{ fontSize: '14px', color: colors.text }}>{t('history_go_suggest')}</Text>
              </View>
            }
          />
        )}
        <View style={{ marginTop: '12px' }}>
          <View onClick={() => setSelectedDate(toDateString(new Date()))} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('history_back_today')}</Text>
          </View>
        </View>
      </SectionCard>
    </PageShell>
  )
}
