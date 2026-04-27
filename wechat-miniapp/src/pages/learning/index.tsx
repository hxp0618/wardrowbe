import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { StatCard } from '../../components/stat-card'
import { colors, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import {
  useAcknowledgeInsight,
  useGenerateInsights,
  useLearning,
  useRecomputeLearning,
} from '../../hooks/use-learning'
import { formatColorLabel, formatItemTypeLabel, formatOccasionLabel, formatStyleLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
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
    hot: '炎热',
    cold: '寒冷',
  }

  if (!canRender) {
    return null
  }

  const handleRecompute = async () => {
    try {
      await recompute.mutateAsync()
      void Taro.showToast({ title: t('learning_toast_recomputed'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('learning_toast_update_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleGenerateInsights = async () => {
    try {
      await generate.mutateAsync()
      void Taro.showToast({ title: t('learning_toast_generated'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('learning_toast_generate_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleAcknowledge = async (insightId: string) => {
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
        <View style={{ display: 'flex', gap: '10px' }}>
          <View onClick={handleRecompute} style={{ ...secondaryButtonStyle, minHeight: '40px', padding: '10px 12px', opacity: recompute.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '12px', color: colors.text }}>{recompute.isPending ? t('learning_action_recomputing') : t('learning_action_recompute')}</Text>
          </View>
          <View onClick={handleGenerateInsights} style={{ ...primaryButtonStyle, minHeight: '40px', padding: '10px 12px', opacity: generate.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '12px', color: colors.accentText }}>{generate.isPending ? t('learning_action_generating') : t('learning_action_generate')}</Text>
          </View>
        </View>
      }
    >
      {isLoading ? (
        <SectionCard title={t('learning_loading_title')}>
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('learning_loading_description')}</Text>
        </SectionCard>
      ) : !data ? (
        <SectionCard title={t('learning_data_title')}>
          <EmptyState title={t('learning_empty_title')} description={t('learning_empty_description')} />
        </SectionCard>
      ) : (
        <>
          <SectionCard title={t('learning_overview_title')}>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <StatCard label={t('learning_feedback_count')} value={String(data.profile.feedback_count)} />
              <StatCard label={t('learning_rated_outfits')} value={String(data.profile.outfits_rated)} />
              <StatCard
                label={t('learning_acceptance_rate')}
                value={
                  data.profile.overall_acceptance_rate == null
                    ? '--'
                    : `${Math.round(data.profile.overall_acceptance_rate * 100) / 100}%`
                }
              />
              <StatCard
                label={t('learning_average_rating')}
                value={data.profile.average_rating == null ? '--' : String(data.profile.average_rating)}
              />
            </View>
          </SectionCard>

          <SectionCard title={t('learning_color_preferences_title')}>
            {data.profile.color_preferences.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.profile.color_preferences.map((item) => (
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
                      {item.interpretation} · {item.score.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('learning_color_empty_title')} description={t('learning_color_empty_description')} />
            )}
          </SectionCard>

          <SectionCard title={t('learning_best_pairs_title')}>
            {data.best_pairs.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.best_pairs.map((pair, index) => (
                  <View
                    key={`${pair.item1.id}-${pair.item2.id}-${index}`}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '14px',
                      backgroundColor: colors.surfaceMuted,
                    }}
                  >
                    <Text style={{ fontSize: '14px', color: colors.text }}>
                      {(pair.item1.name || formatItemTypeLabel(pair.item1.type))} + {(pair.item2.name || formatItemTypeLabel(pair.item2.type))}
                    </Text>
                    <Text style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: colors.textMuted }}>
                      {tf('learning_pair_metrics', {
                        score: pair.compatibility_score.toFixed(2),
                        paired: pair.times_paired,
                        accepted: pair.times_accepted,
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('learning_pairs_empty_title')} description={t('learning_pairs_empty_description')} />
            )}
          </SectionCard>

          <SectionCard title={t('learning_insights_title')}>
            {data.insights.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.insights.map((insight) => (
                  <View
                    key={insight.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '14px',
                      backgroundColor: colors.surfaceMuted,
                    }}
                  >
                    <Text style={{ fontSize: '16px', fontWeight: 600, color: colors.text }}>{insight.title}</Text>
                    <Text style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>
                      {insight.description}
                    </Text>
                    <Text style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: colors.textMuted }}>
                      {tf('learning_insight_confidence', {
                        category: insight.category,
                        confidence: Math.round(insight.confidence * 100),
                      })}
                    </Text>
                    <View style={{ marginTop: '10px' }}>
                      <View onClick={() => handleAcknowledge(insight.id)} style={{ ...secondaryButtonStyle, opacity: acknowledge.isPending ? 0.7 : 1 }}>
                        <Text style={{ fontSize: '14px', color: colors.text }}>{acknowledge.isPending ? t('learning_action_acknowledging') : t('learning_action_acknowledge')}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('learning_insights_empty_title')} description={t('learning_insights_empty_description')} />
            )}
          </SectionCard>

          <SectionCard title={t('learning_style_preferences_title')}>
            {data.profile.style_preferences.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.profile.style_preferences.map((item) => (
                  <View key={item.style} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{formatStyleLabel(item.style)}</Text>
                    <Text style={{ fontSize: '12px', color: colors.textMuted }}>{item.score.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('learning_style_empty_title')} description={t('learning_style_empty_description')} />
            )}
          </SectionCard>

          <SectionCard title={t('learning_occasion_patterns_title')}>
            {data.profile.occasion_patterns.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.profile.occasion_patterns.map((item) => (
                  <View key={item.occasion} style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                    <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <Text style={{ fontSize: '14px', color: colors.text }}>{formatOccasionLabel(item.occasion)}</Text>
                      <Text style={{ fontSize: '12px', color: colors.textMuted }}>{tf('learning_success_rate', { rate: Math.round(item.success_rate * 100) })}</Text>
                    </View>
                    {item.preferred_colors.length > 0 && (
                      <View style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {item.preferred_colors.map((c) => (
                          <Text key={c} style={{ fontSize: '11px', color: colors.textMuted, backgroundColor: colors.surfaceSelected, padding: '2px 8px', borderRadius: '999px' }}>{formatColorLabel(c)}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('learning_pattern_empty_title')} description={t('learning_pattern_empty_description')} />
            )}
          </SectionCard>

          <SectionCard title={t('learning_weather_preferences_title')}>
            {data.profile.weather_preferences.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.profile.weather_preferences.map((item) => (
                  <View key={item.weather_type} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{weatherLabels[item.weather_type] ?? item.weather_type}</Text>
                    <Text style={{ fontSize: '12px', color: colors.textMuted }}>
                      {tf('learning_weather_metrics', {
                        layers: item.preferred_layers,
                        rate: Math.round(item.success_rate * 100),
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('learning_weather_empty_title')} description={t('learning_weather_empty_description')} />
            )}
          </SectionCard>

          {data.preference_suggestions.suggestions && (
            <SectionCard title={t('learning_preference_suggestions_title')}>
              {data.preference_suggestions.suggestions.suggested_favorite_colors?.length ? (
                <View style={{ marginBottom: '12px' }}>
                  <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>{t('learning_suggested_colors_title')}</Text>
                  <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {data.preference_suggestions.suggestions.suggested_favorite_colors.map((c) => (
                      <Text key={c} style={{ fontSize: '11px', color: colors.success, backgroundColor: 'rgba(52, 211, 153, 0.12)', padding: '4px 10px', borderRadius: '999px' }}>{formatColorLabel(c)}</Text>
                    ))}
                  </View>
                </View>
              ) : null}
              {data.preference_suggestions.suggestions.suggested_avoid_colors?.length ? (
                <View style={{ marginBottom: '12px' }}>
                  <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>{t('learning_avoid_colors_title')}</Text>
                  <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {data.preference_suggestions.suggestions.suggested_avoid_colors.map((c) => (
                      <Text key={c} style={{ fontSize: '11px', color: colors.danger, backgroundColor: 'rgba(248, 113, 113, 0.12)', padding: '4px 10px', borderRadius: '999px' }}>{formatColorLabel(c)}</Text>
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
