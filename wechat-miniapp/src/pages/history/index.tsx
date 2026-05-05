import { Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useMemo, useState } from 'react'

import { actionWrapRowStyle, getActionButtonStyle } from '../../components/action-style'
import { EmptyState } from '../../components/empty-state'
import { CompactOptionGroup } from '../../components/compact-option-group'
import { FlatSection } from '../../components/flat-data'
import { OutfitCard } from '../../components/outfit-card'
import { OutfitDetailSheet } from '../../components/outfit-detail-sheet'
import { PageShell } from '../../components/page-shell'
import { colors, inputStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useCalendarOutfits } from '../../hooks/use-outfits'
import {
  getCurrentYearMonth,
  sortByOutfitDateDescending,
  toLocalISODate,
} from '../../lib/date-utils'
import { formatOutfitDetailLabel, formatOccasionLabel, formatOutfitStatusLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import { OCCASION_VALUES, OUTFIT_STATUS_VALUES } from '../../lib/options'
import type { Outfit } from '../../services/types'

export default function HistoryPage() {
  const canRender = useAuthGuard()
  const { year: currentYear, month: currentMonth } = useMemo(() => getCurrentYearMonth(), [])
  const routeStatus = Taro.getCurrentInstance().router?.params?.status
  const initialStatusIndex = OUTFIT_STATUS_VALUES.findIndex((value) => value === routeStatus) + 1
  const [monthValue, setMonthValue] = useState(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)
  const [occasionIndex, setOccasionIndex] = useState(0)
  const [statusIndex, setStatusIndex] = useState(initialStatusIndex)
  const [selectedDate, setSelectedDate] = useState<string>(toLocalISODate(new Date()))
  const [detailOutfit, setDetailOutfit] = useState<Outfit | null>(null)
  const { t, tf } = useI18n()
  const occasionOptions = [
    t('history_filter_occasion_all'),
    ...OCCASION_VALUES.map((value) => formatOccasionLabel(value)),
  ]
  const statusOptions = [
    t('history_filter_status_all'),
    ...OUTFIT_STATUS_VALUES.map((value) => formatOutfitStatusLabel(value)),
  ]
  const loadingText = t('history_loading')
  const todayString = toLocalISODate(new Date())
  const [year, month] = monthValue.split('-').map(Number)
  const occasion = occasionIndex === 0 ? undefined : OCCASION_VALUES[occasionIndex - 1]
  const status = statusIndex === 0 ? undefined : OUTFIT_STATUS_VALUES[statusIndex - 1]
  const { data, isLoading } = useCalendarOutfits(year, month, {
    occasion,
    status,
  })

  const outfits = data?.outfits ?? []
  const selectedOutfits = sortByOutfitDateDescending(
    outfits.filter((outfit) => outfit.scheduled_for === selectedDate)
  )
  const groupedDates = Array.from(
    new Set(
      sortByOutfitDateDescending(outfits)
        .map((outfit) => outfit.scheduled_for)
        .filter((date): date is string => Boolean(date))
    )
  )

  useEffect(() => {
    if (groupedDates.length > 0 && !groupedDates.includes(selectedDate)) {
      setSelectedDate(groupedDates[0])
    }
  }, [groupedDates, selectedDate])

  if (!canRender) {
    return null
  }

  return (
    <PageShell title={t('page_history_title')} subtitle={t('page_history_subtitle')} navKey='dashboard'>
      <View style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2px' }}>
        <Text style={{ fontSize: '13px', fontWeight: 600, color: colors.textMuted }}>
          {t('history_filters_title')}
        </Text>
        <Picker mode='date' fields='month' value={monthValue} onChange={(event) => setMonthValue(event.detail.value)}>
          <View style={inputStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{tf('history_month_label', { value: monthValue })}</Text>
          </View>
        </Picker>
        <CompactOptionGroup
          activeIndex={occasionIndex}
          options={occasionOptions}
          onChange={setOccasionIndex}
        />
        <CompactOptionGroup
          activeIndex={statusIndex}
          options={statusOptions}
          onChange={setStatusIndex}
        />
        <View style={{ paddingTop: '2px', borderTop: `1px solid ${colors.border}` }}>
          <Text style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: colors.textMuted }}>{t('history_dates_title')}</Text>
          {groupedDates.length ? (
            <View style={actionWrapRowStyle}>
              {groupedDates.map((date) => {
                const selected = date === selectedDate
                return (
                  <View
                    key={date}
                    ariaRole='button'
                    ariaLabel={`查看 ${date} 记录`}
                    onClick={() => setSelectedDate(date)}
                    style={{
                      minHeight: '44px',
                      padding: '7px 12px',
                      borderRadius: '999px',
                      border: selected ? `1px solid ${colors.borderStrong}` : `1px solid ${colors.border}`,
                      backgroundColor: selected ? colors.surfaceSelected : colors.surfaceMuted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                    }}
                  >
                    <Text style={{ fontSize: '12px', color: selected ? colors.text : colors.textMuted }}>{date}</Text>
                  </View>
                )
              })}
            </View>
          ) : (
            <EmptyState embedded title={t('history_empty_month_title')} description={t('history_empty_month_description')} />
          )}
        </View>
      </View>

      <FlatSection title={t('history_records_title')} extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{selectedDate}</Text>}>
        {isLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{loadingText}</Text>
        ) : selectedOutfits.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedOutfits.map((outfit) => (
              <View
                key={outfit.id}
                ariaRole='button'
                ariaLabel={formatOutfitDetailLabel(outfit)}
                onClick={() => setDetailOutfit(outfit)}
              >
                <OutfitCard outfit={outfit} />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            embedded
            title={t('history_empty_day_title')}
            description={t('history_empty_day_description')}
            action={
              <View
                ariaRole='button'
                ariaLabel={t('history_go_suggest')}
                onClick={() => void Taro.switchTab({ url: '/pages/suggest/index' })}
                style={getActionButtonStyle()}
              >
                <Text style={{ fontSize: '14px', color: colors.text }}>{t('history_go_suggest')}</Text>
              </View>
            }
          />
        )}
        {selectedDate !== todayString ? (
          <View style={{ marginTop: '12px' }}>
            <View ariaRole='button' ariaLabel={t('history_back_today')} onClick={() => setSelectedDate(todayString)} style={getActionButtonStyle()}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{t('history_back_today')}</Text>
            </View>
          </View>
        ) : null}
      </FlatSection>
      <OutfitDetailSheet outfit={detailOutfit} visible={!!detailOutfit} onClose={() => setDetailOutfit(null)} />
    </PageShell>
  )
}
