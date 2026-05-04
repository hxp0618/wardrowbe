import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { ReactNode } from 'react'

import {
  actionRowStyle,
  actionWrapRowStyle,
  getActionButtonStyle,
  getEnabledActionHandler,
  getToneActionSurfaceStyle,
} from '../../components/action-style'
import { EmptyState } from '../../components/empty-state'
import { FlatList, FlatListRow, FlatMetricGrid } from '../../components/flat-data'
import { PageShell } from '../../components/page-shell'
import { PreviewableImage } from '../../components/previewable-image'
import { SectionCard } from '../../components/section-card'
import { colors } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import {
  useAcknowledgeInsight,
  useGenerateInsights,
  useLearning,
  useRecomputeLearning,
} from '../../hooks/use-learning'
import { clampPercent, normalizeChartId } from '../../lib/chart-utils'
import { formatColorLabel, formatItemTypeLabel, formatOccasionLabel, formatStyleLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import { getDisplayImageUrl, getPreviewImageUrl } from '../../lib/image-preview'
import type { ItemPair, LearningItemInfo } from '../../services/types'

function formatFractionPercent(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`
}

function formatSignedScore(score: number): string {
  const value = score.toFixed(2)
  return score > 0 ? `+${value}` : value
}

function scoreToPercent(score: number): number {
  return clampPercent(Math.abs(score) * 100)
}

function scoreColor(score: number): string {
  if (score < -0.2) return colors.danger
  if (score > 0.2) return colors.success
  return colors.warning
}

function PreferenceBar(props: {
  ariaLabel: string
  label: string
  value: string
  percent: number
  color?: string
  detail?: string
  children?: ReactNode
}) {
  const percent = clampPercent(props.percent)

  return (
    <View style={{ padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <Text style={{ flex: 1, minWidth: 0, fontSize: '14px', color: colors.text }} numberOfLines={1}>
          {props.label}
        </Text>
        <Text style={{ fontSize: '12px', color: colors.textMuted }}>{props.value}</Text>
      </View>
      {props.detail ? (
        <Text style={{ display: 'block', marginTop: '5px', fontSize: '12px', color: colors.textMuted }}>
          {props.detail}
        </Text>
      ) : null}
      <View style={{ height: '8px', marginTop: '8px', borderRadius: '999px', backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
        <View
          ariaRole='img'
          ariaLabel={props.ariaLabel}
          style={{
            width: `${percent}%`,
            height: '100%',
            minWidth: percent > 0 ? '8px' : '0',
            borderRadius: '999px',
            backgroundColor: props.color || colors.accent,
          }}
        />
      </View>
      {props.children ? (
        <View style={{ marginTop: '8px' }}>
          {props.children}
        </View>
      ) : null}
    </View>
  )
}

function LearningPairVisual(props: { item: LearningItemInfo; previewUrls: string[] }) {
  const displayUrl = getDisplayImageUrl(props.item)
  const previewUrl = getPreviewImageUrl(props.item)
  const title = props.item.name || formatItemTypeLabel(props.item.type)

  if (!displayUrl) {
    return (
      <View style={{ flex: 1, height: '76px', borderRadius: '8px', backgroundColor: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: '12px', color: colors.textMuted }}>{formatItemTypeLabel(props.item.type)}</Text>
      </View>
    )
  }

  return (
    <PreviewableImage
      ariaLabel={`查看 ${title} 大图`}
      src={displayUrl}
      previewCurrent={previewUrl ?? displayUrl}
      previewUrls={props.previewUrls.length ? props.previewUrls : [previewUrl ?? displayUrl]}
      style={{ flex: 1, height: '76px', borderRadius: '8px', backgroundColor: colors.surfaceMuted }}
    />
  )
}

function LearningPairRow(props: { pair: ItemPair; metrics: string }) {
  const previewUrls = [getPreviewImageUrl(props.pair.item1), getPreviewImageUrl(props.pair.item2)]
    .filter((url): url is string => Boolean(url))
  const item1Name = props.pair.item1.name || formatItemTypeLabel(props.pair.item1.type)
  const item2Name = props.pair.item2.name || formatItemTypeLabel(props.pair.item2.type)

  return (
    <FlatListRow key={`${props.pair.item1.id}-${props.pair.item2.id}`}>
      <View style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <LearningPairVisual item={props.pair.item1} previewUrls={previewUrls} />
        <LearningPairVisual item={props.pair.item2} previewUrls={previewUrls} />
      </View>
      <Text style={{ fontSize: '14px', color: colors.text }}>
        {item1Name} + {item2Name}
      </Text>
      <Text style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: colors.textMuted }}>
        {props.metrics}
      </Text>
    </FlatListRow>
  )
}

export default function LearningPage() {
  const canRender = useAuthGuard()
  const { t, tf } = useI18n()
  const { data, isLoading } = useLearning()
  const recompute = useRecomputeLearning()
  const generate = useGenerateInsights()
  const acknowledge = useAcknowledgeInsight()
  const weatherLabels: Record<string, string> = {
    sunny: '晴天',
    cloudy: '阴天',
    rainy: '雨天',
    snowy: '雪天',
    windy: '大风',
    cool: '凉爽',
    mild: '温和',
    hot: '炎热',
    cold: '寒冷',
  }

  if (!canRender) {
    return null
  }

  const recomputeDisabled = recompute.isPending
  const generateDisabled = generate.isPending
  const acknowledgeDisabled = acknowledge.isPending

  const handleRecompute = async () => {
    if (recomputeDisabled) return

    try {
      await recompute.mutateAsync()
      void Taro.showToast({ title: t('learning_toast_recomputed'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('learning_toast_update_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleGenerateInsights = async () => {
    if (generateDisabled) return

    try {
      await generate.mutateAsync()
      void Taro.showToast({ title: t('learning_toast_generated'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('learning_toast_generate_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleAcknowledge = async (insightId: string) => {
    if (acknowledgeDisabled) return

    try {
      await acknowledge.mutateAsync(insightId)
      void Taro.showToast({ title: t('learning_toast_acknowledged'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('learning_toast_action_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell
      title={t('page_learning_title')}
      subtitle={t('page_learning_subtitle')}
      navKey='settings'
      actions={
        <View style={{ ...actionRowStyle, gap: '10px' }}>
          <View ariaRole='button' ariaLabel={t('learning_action_recompute')} onClick={getEnabledActionHandler(recomputeDisabled, handleRecompute)} style={getActionButtonStyle({ compact: true, disabled: recomputeDisabled })}>
            <Text style={{ fontSize: '12px', color: colors.text }}>{recompute.isPending ? t('learning_action_recomputing') : t('learning_action_recompute')}</Text>
          </View>
          <View ariaRole='button' ariaLabel={t('learning_action_generate')} onClick={getEnabledActionHandler(generateDisabled, handleGenerateInsights)} style={getActionButtonStyle({ variant: 'primary', compact: true, disabled: generateDisabled })}>
            <Text style={{ fontSize: '12px', color: colors.accentText }}>{generate.isPending ? t('learning_action_generating') : t('learning_action_generate')}</Text>
          </View>
        </View>
      }
    >
      {isLoading ? (
        <SectionCard compact title={t('learning_loading_title')}>
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('learning_loading_description')}</Text>
        </SectionCard>
      ) : !data ? (
        <SectionCard compact title={t('learning_data_title')}>
          <EmptyState embedded title={t('learning_empty_title')} description={t('learning_empty_description')} />
        </SectionCard>
      ) : (
        <>
          <SectionCard compact title={t('learning_overview_title')}>
            <FlatMetricGrid
              metrics={[
                { label: t('learning_feedback_count'), value: String(data.profile.feedback_count) },
                { label: t('learning_rated_outfits'), value: String(data.profile.outfits_rated) },
                {
                  label: t('learning_acceptance_rate'),
                  value:
                    data.profile.overall_acceptance_rate == null
                      ? '--'
                      : formatFractionPercent(data.profile.overall_acceptance_rate),
                },
                {
                  label: t('learning_average_rating'),
                  value: data.profile.average_rating == null ? '--' : String(data.profile.average_rating),
                },
              ]}
            />
          </SectionCard>

          <SectionCard compact title={t('learning_color_preferences_title')}>
            {data.profile.color_preferences.length ? (
              <View style={{ borderTop: `1px solid ${colors.border}` }}>
                {data.profile.color_preferences.map((item) => (
                  <PreferenceBar
                    key={item.color}
                    ariaLabel={`learning-color-bar-${normalizeChartId(item.color)}`}
                    label={formatColorLabel(item.color)}
                    value={`${item.interpretation} · ${formatSignedScore(item.score)}`}
                    percent={scoreToPercent(item.score)}
                    color={scoreColor(item.score)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState embedded title={t('learning_color_empty_title')} description={t('learning_color_empty_description')} />
            )}
          </SectionCard>

          <SectionCard compact title={t('learning_best_pairs_title')}>
            {data.best_pairs.length ? (
              <FlatList>
                {data.best_pairs.map((pair, index) => (
                  <LearningPairRow
                    key={`${pair.item1.id}-${pair.item2.id}-${index}`}
                    pair={pair}
                    metrics={tf('learning_pair_metrics', {
                        score: pair.compatibility_score.toFixed(2),
                        paired: pair.times_paired,
                        accepted: pair.times_accepted,
                      })}
                  />
                ))}
              </FlatList>
            ) : (
              <EmptyState embedded title={t('learning_pairs_empty_title')} description={t('learning_pairs_empty_description')} />
            )}
          </SectionCard>

          <SectionCard compact title={t('learning_insights_title')}>
            {data.insights.length ? (
              <FlatList>
                {data.insights.map((insight) => (
                  <FlatListRow
                    key={insight.id}
                  >
                    <Text style={{ fontSize: '15px', fontWeight: 600, color: colors.text }}>{insight.title}</Text>
                    <Text style={{ display: 'block', marginTop: '6px', fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>
                      {insight.description}
                    </Text>
                    <Text style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: colors.textMuted }}>
                      {tf('learning_insight_confidence', {
                        category: insight.category,
                        confidence: Math.round(insight.confidence * 100),
                      })}
                    </Text>
                    <View style={{ marginTop: '8px' }}>
                      <View ariaRole='button' ariaLabel={t('learning_action_acknowledge')} onClick={getEnabledActionHandler(acknowledgeDisabled, () => handleAcknowledge(insight.id))} style={getActionButtonStyle({ disabled: acknowledgeDisabled })}>
                        <Text style={{ fontSize: '14px', color: colors.text }}>{acknowledge.isPending ? t('learning_action_acknowledging') : t('learning_action_acknowledge')}</Text>
                      </View>
                    </View>
                  </FlatListRow>
                ))}
              </FlatList>
            ) : (
              <EmptyState embedded title={t('learning_insights_empty_title')} description={t('learning_insights_empty_description')} />
            )}
          </SectionCard>

          <SectionCard compact title={t('learning_style_preferences_title')}>
            {data.profile.style_preferences.length ? (
              <View style={{ borderTop: `1px solid ${colors.border}` }}>
                {data.profile.style_preferences.map((item) => (
                  <PreferenceBar
                    key={item.style}
                    ariaLabel={`learning-style-bar-${normalizeChartId(item.style)}`}
                    label={formatStyleLabel(item.style)}
                    value={formatSignedScore(item.score)}
                    percent={scoreToPercent(item.score)}
                    color={scoreColor(item.score)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState embedded title={t('learning_style_empty_title')} description={t('learning_style_empty_description')} />
            )}
          </SectionCard>

          <SectionCard compact title={t('learning_occasion_patterns_title')}>
            {data.profile.occasion_patterns.length ? (
              <View style={{ borderTop: `1px solid ${colors.border}` }}>
                {data.profile.occasion_patterns.map((item) => (
                  <PreferenceBar
                    key={item.occasion}
                    ariaLabel={`learning-occasion-bar-${normalizeChartId(item.occasion)}`}
                    label={formatOccasionLabel(item.occasion)}
                    value={tf('learning_success_rate', { rate: Math.round(item.success_rate * 100) })}
                    percent={item.success_rate * 100}
                    color={colors.success}
                  >
                    {item.preferred_colors.length > 0 && (
                      <View style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {item.preferred_colors.map((c) => (
                          <Text key={c} style={{ fontSize: '11px', color: colors.textMuted, backgroundColor: colors.surfaceSelected, padding: '2px 8px', borderRadius: '999px' }}>{formatColorLabel(c)}</Text>
                        ))}
                      </View>
                    )}
                  </PreferenceBar>
                ))}
              </View>
            ) : (
              <EmptyState embedded title={t('learning_pattern_empty_title')} description={t('learning_pattern_empty_description')} />
            )}
          </SectionCard>

          <SectionCard compact title={t('learning_weather_preferences_title')}>
            {data.profile.weather_preferences.length ? (
              <View style={{ borderTop: `1px solid ${colors.border}` }}>
                {data.profile.weather_preferences.map((item) => (
                  <PreferenceBar
                    key={item.weather_type}
                    ariaLabel={`learning-weather-bar-${normalizeChartId(item.weather_type)}`}
                    label={weatherLabels[item.weather_type] ?? item.weather_type}
                    value={tf('learning_success_rate', { rate: Math.round(item.success_rate * 100) })}
                    detail={tf('learning_weather_metrics', {
                        layers: item.preferred_layers,
                        rate: Math.round(item.success_rate * 100),
                      })}
                    percent={item.success_rate * 100}
                    color={colors.infoText}
                  />
                ))}
              </View>
            ) : (
              <EmptyState embedded title={t('learning_weather_empty_title')} description={t('learning_weather_empty_description')} />
            )}
          </SectionCard>

          {data.preference_suggestions.suggestions && (
            <SectionCard compact title={t('learning_preference_suggestions_title')}>
              {data.preference_suggestions.suggestions.suggested_favorite_colors?.length ? (
                <View style={{ marginBottom: '12px' }}>
                  <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>{t('learning_suggested_colors_title')}</Text>
                  <View style={actionWrapRowStyle}>
                    {data.preference_suggestions.suggestions.suggested_favorite_colors.map((c) => (
                      <Text key={c} style={{ fontSize: '11px', color: colors.success, padding: '4px 10px', borderRadius: '999px', ...getToneActionSurfaceStyle('success') }}>{formatColorLabel(c)}</Text>
                    ))}
                  </View>
                </View>
              ) : null}
              {data.preference_suggestions.suggestions.suggested_avoid_colors?.length ? (
                <View style={{ marginBottom: '12px' }}>
                  <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>{t('learning_avoid_colors_title')}</Text>
                  <View style={actionWrapRowStyle}>
                    {data.preference_suggestions.suggestions.suggested_avoid_colors.map((c) => (
                      <Text key={c} style={{ fontSize: '11px', color: colors.danger, padding: '4px 10px', borderRadius: '999px', ...getToneActionSurfaceStyle('danger') }}>{formatColorLabel(c)}</Text>
                    ))}
                  </View>
                </View>
              ) : null}
              {data.preference_suggestions.reason && (
                <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{data.preference_suggestions.reason}</Text>
              )}
            </SectionCard>
          )}
        </>
      )}
    </PageShell>
  )
}
