import { Text, View } from '@tarojs/components'
import { useState } from 'react'

import { CompactOptionGroup } from '../../components/compact-option-group'
import { EmptyState } from '../../components/empty-state'
import { FlatList, FlatListRow, FlatMetricGrid } from '../../components/flat-data'
import { PageShell } from '../../components/page-shell'
import { PreviewableImage } from '../../components/previewable-image'
import { SectionCard } from '../../components/section-card'
import { colors } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useAnalytics } from '../../hooks/use-analytics'
import { clampPercent, normalizeChartId } from '../../lib/chart-utils'
import { formatColorLabel, formatItemTypeLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import { getDisplayImageUrl, getPreviewImageUrl } from '../../lib/image-preview'
import { getWardrobeColorHex } from '../../lib/options'
import type { AcceptanceRateTrend, ColorDistribution, TypeDistribution, WearStats } from '../../services/types'

const DAY_OPTIONS = ['30 天', '60 天', '90 天']
const DAY_VALUES = [30, 60, 90]

function DistributionChart(props: {
  ariaPrefix: string
  items: Array<{ id: string; label: string; count: number; percentage: number; swatch?: string }>
}) {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {props.items.map((item) => {
        const percentage = clampPercent(item.percentage)

        return (
          <View key={item.id}>
            <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <View style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.swatch ? (
                  <View style={{ width: '12px', height: '12px', borderRadius: '999px', backgroundColor: item.swatch, border: `1px solid ${colors.borderStrong}`, flexShrink: 0 }} />
                ) : null}
                <Text style={{ fontSize: '14px', color: colors.text }} numberOfLines={1}>{item.label}</Text>
              </View>
              <Text style={{ fontSize: '12px', color: colors.textMuted }}>{item.count} · {percentage}%</Text>
            </View>
            <View style={{ height: '8px', marginTop: '7px', borderRadius: '999px', backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
              <View
                ariaRole='img'
                ariaLabel={`${props.ariaPrefix}-${normalizeChartId(item.id)}`}
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  borderRadius: '999px',
                  backgroundColor: item.swatch || colors.accent,
                }}
              />
            </View>
          </View>
        )
      })}
    </View>
  )
}

function AcceptanceTrendChart(props: { items: AcceptanceRateTrend[] }) {
  return (
    <View style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '118px', paddingTop: '6px' }}>
      {props.items.map((item) => {
        const rate = clampPercent(item.rate)
        const barHeight = Math.max(8, Math.round(rate * 0.72))

        return (
          <View key={item.period} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Text style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '6px' }}>{rate}%</Text>
            <View style={{ width: '100%', height: '72px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <View
                ariaRole='img'
                ariaLabel={`analytics-trend-bar-${normalizeChartId(item.period)}`}
                style={{
                  width: '100%',
                  maxWidth: '32px',
                  height: `${barHeight}px`,
                  borderRadius: '8px 8px 2px 2px',
                  backgroundColor: rate >= 70 ? colors.success : rate >= 45 ? colors.warning : colors.danger,
                }}
              />
            </View>
            <Text style={{ display: 'block', marginTop: '7px', fontSize: '11px', color: colors.textSoft }} numberOfLines={1}>
              {item.period}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function toColorChartItems(items: ColorDistribution[]) {
  return items.map((item) => ({
    id: item.color,
    label: formatColorLabel(item.color),
    count: item.count,
    percentage: item.percentage,
    swatch: getWardrobeColorHex(item.color) || colors.accent,
  }))
}

function toTypeChartItems(items: TypeDistribution[]) {
  return items.map((item) => ({
    id: item.type,
    label: formatItemTypeLabel(item.type),
    count: item.count,
    percentage: item.percentage,
  }))
}

function WearStatsRow(props: { item: WearStats; value: string; tone?: 'default' | 'warning' }) {
  const displayUrl = getDisplayImageUrl(props.item)
  const previewUrl = getPreviewImageUrl(props.item)
  const title = props.item.name || formatItemTypeLabel(props.item.type)

  return (
    <FlatListRow
      key={props.item.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {displayUrl ? (
        <PreviewableImage
          ariaLabel={`查看 ${title} 大图`}
          src={displayUrl}
          previewCurrent={previewUrl ?? displayUrl}
          previewUrls={previewUrl ? [previewUrl] : [displayUrl]}
          style={{ width: '52px', height: '64px', borderRadius: '8px', backgroundColor: colors.surfaceMuted }}
        />
      ) : (
        <View style={{ width: '52px', height: '64px', borderRadius: '8px', backgroundColor: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: '11px', color: colors.textMuted }}>{formatItemTypeLabel(props.item.type)}</Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ display: 'block', fontSize: '14px', color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
          {formatItemTypeLabel(props.item.type)}
        </Text>
      </View>
      <Text style={{ fontSize: '12px', color: props.tone === 'warning' ? colors.warning : colors.textMuted }}>
        {props.value}
      </Text>
    </FlatListRow>
  )
}

export default function AnalyticsPage() {
  const canRender = useAuthGuard()
  const [dayIndex, setDayIndex] = useState(1)
  const { t, tf } = useI18n()
  const dayOptions = DAY_OPTIONS
  const days = DAY_VALUES[dayIndex]
  const { data, isLoading } = useAnalytics(days)

  if (!canRender) {
    return null
  }

  return (
    <PageShell title={t('page_analytics_title')} subtitle={t('page_analytics_subtitle')} navKey='dashboard'>
      <View style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '2px' }}>
        <Text style={{ fontSize: '13px', fontWeight: 600, color: colors.textMuted }}>
          {t('analytics_range_title')}
        </Text>
        <CompactOptionGroup
          activeIndex={dayIndex}
          options={dayOptions}
          onChange={setDayIndex}
        />
      </View>

      {isLoading ? (
        <SectionCard compact title={t('analytics_loading_title')}>
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('analytics_loading_description')}</Text>
        </SectionCard>
      ) : !data ? (
        <SectionCard compact title={t('analytics_result_title')}>
          <EmptyState embedded title={t('analytics_empty_title')} description={t('analytics_empty_description')} />
        </SectionCard>
      ) : (
        <>
          <SectionCard compact title={t('analytics_core_metrics_title')}>
            <FlatMetricGrid
              metrics={[
                { label: t('analytics_total_items'), value: String(data.wardrobe.total_items) },
                { label: t('analytics_total_outfits'), value: String(data.wardrobe.total_outfits) },
                {
                  label: t('analytics_acceptance_rate'),
                  value: data.wardrobe.acceptance_rate == null ? '--' : `${data.wardrobe.acceptance_rate}%`,
                },
                {
                  label: t('analytics_average_rating'),
                  value: data.wardrobe.average_rating == null ? '--' : String(data.wardrobe.average_rating),
                },
              ]}
            />
          </SectionCard>

          <SectionCard compact title={t('analytics_color_distribution_title')}>
            {data.color_distribution.length ? (
              <DistributionChart
                ariaPrefix='analytics-color-bar'
                items={toColorChartItems(data.color_distribution)}
              />
            ) : (
              <EmptyState embedded title={t('analytics_color_empty_title')} description={t('analytics_color_empty_description')} />
            )}
          </SectionCard>

          <SectionCard compact title={t('analytics_type_distribution_title')}>
            {data.type_distribution.length ? (
              <DistributionChart
                ariaPrefix='analytics-type-bar'
                items={toTypeChartItems(data.type_distribution)}
              />
            ) : (
              <EmptyState embedded title={t('analytics_type_empty_title')} description={t('analytics_type_empty_description')} />
            )}
          </SectionCard>

          <SectionCard compact title={t('analytics_acceptance_trend_title')}>
            {data.acceptance_trend.length ? (
              <AcceptanceTrendChart items={data.acceptance_trend.slice(-6)} />
            ) : (
              <EmptyState embedded title={t('analytics_trend_empty_title')} description={t('analytics_trend_empty_description')} />
            )}
          </SectionCard>

          <SectionCard compact title={t('analytics_insights_title')}>
            {data.insights.length ? (
              <FlatList>
                {data.insights.map((insight) => (
                  <FlatListRow
                    key={insight}
                  >
                    <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{insight}</Text>
                  </FlatListRow>
                ))}
              </FlatList>
            ) : (
              <EmptyState embedded title={t('analytics_insights_empty_title')} description={t('analytics_insights_empty_description')} />
            )}
          </SectionCard>

          <SectionCard compact title={t('analytics_most_worn_title')}>
            {data.most_worn.length ? (
              <FlatList>
                {data.most_worn.slice(0, 5).map((item) => (
                  <WearStatsRow key={item.id} item={item} value={tf('analytics_wear_count', { count: item.wear_count })} />
                ))}
              </FlatList>
            ) : (
              <EmptyState embedded title={t('analytics_no_data_title')} description={t('analytics_no_data_description')} />
            )}
          </SectionCard>

          <SectionCard compact title={t('analytics_least_worn_title')}>
            {data.least_worn.length ? (
              <FlatList>
                {data.least_worn.slice(0, 5).map((item) => (
                  <WearStatsRow key={item.id} item={item} value={tf('analytics_wear_count', { count: item.wear_count })} />
                ))}
              </FlatList>
            ) : (
              <EmptyState embedded title={t('analytics_no_data_title')} description={t('analytics_need_more_records')} />
            )}
          </SectionCard>

          <SectionCard compact title={t('analytics_never_worn_title')}>
            {data.never_worn.length ? (
              <FlatList>
                {data.never_worn.slice(0, 5).map((item) => (
                  <WearStatsRow key={item.id} item={item} value={t('analytics_never_worn_label')} tone='warning' />
                ))}
              </FlatList>
            ) : (
              <EmptyState embedded title={t('analytics_everything_worn_title')} description={t('analytics_everything_worn_description')} />
            )}
          </SectionCard>
        </>
      )}
    </PageShell>
  )
}
