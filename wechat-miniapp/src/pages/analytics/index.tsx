import { Picker, Text, View } from '@tarojs/components'
import { useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { StatCard } from '../../components/stat-card'
import { colors, inputStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useAnalytics } from '../../hooks/use-analytics'
import { formatColorLabel, formatItemTypeLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'

const DAY_OPTIONS = ['30 天', '60 天', '90 天']
const DAY_VALUES = [30, 60, 90]

export default function AnalyticsPage() {
  const canRender = useAuthGuard()
  const [dayIndex, setDayIndex] = useState(1)
  const { t, tf, locale } = useI18n()
  const dayOptions = locale === 'en' ? ['30 days', '60 days', '90 days'] : DAY_OPTIONS
  const days = DAY_VALUES[dayIndex]
  const { data, isLoading } = useAnalytics(days)

  if (!canRender) {
    return null
  }

  return (
    <PageShell title={t('page_analytics_title')} subtitle={t('page_analytics_subtitle')} navKey='dashboard'>
      <SectionCard title={t('analytics_range_title')}>
        <Picker mode='selector' range={dayOptions} value={dayIndex} onChange={(event) => setDayIndex(Number(event.detail.value))}>
          <View style={inputStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{dayOptions[dayIndex]}</Text>
          </View>
        </Picker>
      </SectionCard>

      {isLoading ? (
        <SectionCard title={t('analytics_loading_title')}>
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('analytics_loading_description')}</Text>
        </SectionCard>
      ) : !data ? (
        <SectionCard title={t('analytics_result_title')}>
          <EmptyState title={t('analytics_empty_title')} description={t('analytics_empty_description')} />
        </SectionCard>
      ) : (
        <>
          <SectionCard title={t('analytics_core_metrics_title')}>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <StatCard label={t('analytics_total_items')} value={String(data.wardrobe.total_items)} />
              <StatCard label={t('analytics_total_outfits')} value={String(data.wardrobe.total_outfits)} />
              <StatCard
                label={t('analytics_acceptance_rate')}
                value={data.wardrobe.acceptance_rate == null ? '--' : `${data.wardrobe.acceptance_rate}%`}
              />
              <StatCard
                label={t('analytics_average_rating')}
                value={data.wardrobe.average_rating == null ? '--' : String(data.wardrobe.average_rating)}
              />
            </View>
          </SectionCard>

          <SectionCard title={t('analytics_color_distribution_title')}>
            {data.color_distribution.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.color_distribution.map((item) => (
                  <View
                    key={item.color}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      backgroundColor: colors.surfaceMuted,
                    }}
                  >
                    <Text style={{ fontSize: '14px', color: colors.text }}>{formatColorLabel(item.color)}</Text>
                    <Text style={{ fontSize: '12px', color: colors.textMuted }}>
                      {tf('analytics_distribution_value', { count: item.count, percentage: item.percentage })}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('analytics_color_empty_title')} description={t('analytics_color_empty_description')} />
            )}
          </SectionCard>

          <SectionCard title={t('analytics_type_distribution_title')}>
            {data.type_distribution.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.type_distribution.map((item) => (
                  <View
                    key={item.type}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      backgroundColor: colors.surfaceMuted,
                    }}
                  >
                    <Text style={{ fontSize: '14px', color: colors.text }}>{formatItemTypeLabel(item.type)}</Text>
                    <Text style={{ fontSize: '12px', color: colors.textMuted }}>
                      {tf('analytics_distribution_value', { count: item.count, percentage: item.percentage })}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('analytics_type_empty_title')} description={t('analytics_type_empty_description')} />
            )}
          </SectionCard>

          <SectionCard title={t('analytics_insights_title')}>
            {data.insights.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.insights.map((insight) => (
                  <View
                    key={insight}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '14px',
                      backgroundColor: colors.surfaceMuted,
                    }}
                  >
                    <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{insight}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('analytics_insights_empty_title')} description={t('analytics_insights_empty_description')} />
            )}
          </SectionCard>

          <SectionCard title={t('analytics_most_worn_title')}>
            {data.most_worn.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.most_worn.slice(0, 5).map((item) => (
                  <View key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{item.name || formatItemTypeLabel(item.type)}</Text>
                    <Text style={{ fontSize: '12px', color: colors.textMuted }}>{tf('analytics_wear_count', { count: item.wear_count })}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('analytics_no_data_title')} description={t('analytics_no_data_description')} />
            )}
          </SectionCard>

          <SectionCard title={t('analytics_least_worn_title')}>
            {data.least_worn.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.least_worn.slice(0, 5).map((item) => (
                  <View key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{item.name || formatItemTypeLabel(item.type)}</Text>
                    <Text style={{ fontSize: '12px', color: colors.textMuted }}>{tf('analytics_wear_count', { count: item.wear_count })}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('analytics_no_data_title')} description={t('analytics_need_more_records')} />
            )}
          </SectionCard>

          <SectionCard title={t('analytics_never_worn_title')}>
            {data.never_worn.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.never_worn.slice(0, 5).map((item) => (
                  <View key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', backgroundColor: 'rgba(251, 191, 36, 0.12)' }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{item.name || formatItemTypeLabel(item.type)}</Text>
                    <Text style={{ fontSize: '12px', color: colors.warning }}>{t('analytics_never_worn_label')}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('analytics_everything_worn_title')} description={t('analytics_everything_worn_description')} />
            )}
          </SectionCard>
        </>
      )}
    </PageShell>
  )
}
