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
const WEATHER_LABELS: Record<string, string> = {
  sunny: '晴天',
  cloudy: '阴天',
  rainy: '雨天',
  snowy: '雪天',
  windy: '大风',
  hot: '炎热',
  cold: '寒冷',
}
export default function LearningPage() {
  const canRender = useAuthGuard()
  const { data, isLoading } = useLearning()
  const recompute = useRecomputeLearning()
  const generate = useGenerateInsights()
  const acknowledge = useAcknowledgeInsight()

  if (!canRender) {
    return null
  }

  const handleRecompute = async () => {
    try {
      await recompute.mutateAsync()
      void Taro.showToast({ title: '学习画像已更新', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleGenerateInsights = async () => {
    try {
      await generate.mutateAsync()
      void Taro.showToast({ title: '已生成新洞察', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleAcknowledge = async (insightId: string) => {
    try {
      await acknowledge.mutateAsync(insightId)
      void Taro.showToast({ title: '已确认洞察', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell
      title='学习'
      subtitle='AI 根据你的偏好不断学习'
      navKey='settings'
      actions={
        <View style={{ display: 'flex', gap: '10px' }}>
          <View onClick={handleRecompute} style={{ ...secondaryButtonStyle, minHeight: '40px', padding: '10px 12px', opacity: recompute.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '12px', color: colors.text }}>{recompute.isPending ? '重算中...' : '重算'}</Text>
          </View>
          <View onClick={handleGenerateInsights} style={{ ...primaryButtonStyle, minHeight: '40px', padding: '10px 12px', opacity: generate.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '12px', color: colors.accentText }}>{generate.isPending ? '生成中...' : '生成洞察'}</Text>
          </View>
        </View>
      }
    >
      {isLoading ? (
        <SectionCard title='加载中'>
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>正在读取学习画像...</Text>
        </SectionCard>
      ) : !data ? (
        <SectionCard title='学习数据'>
          <EmptyState title='暂无学习数据' description='评分、接受和拒绝记录增加后，学习画像会逐步建立。' />
        </SectionCard>
      ) : (
        <>
          <SectionCard title='学习概览'>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <StatCard label='反馈数' value={String(data.profile.feedback_count)} />
              <StatCard label='已评分穿搭' value={String(data.profile.outfits_rated)} />
              <StatCard
                label='接受率'
                value={
                  data.profile.overall_acceptance_rate == null
                    ? '--'
                    : `${Math.round(data.profile.overall_acceptance_rate * 100) / 100}%`
                }
              />
              <StatCard
                label='平均评分'
                value={data.profile.average_rating == null ? '--' : String(data.profile.average_rating)}
              />
            </View>
          </SectionCard>

          <SectionCard title='颜色偏好'>
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
              <EmptyState title='暂无颜色偏好' description='当用户对穿搭持续反馈后，这里会出现颜色偏好分数。' />
            )}
          </SectionCard>

          <SectionCard title='最佳单品组合'>
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
                      兼容分 {pair.compatibility_score.toFixed(2)} · 配对 {pair.times_paired} 次 · 接受 {pair.times_accepted} 次
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title='暂无组合数据' description='组合表现要等历史穿搭和反馈数据积累后才能稳定输出。' />
            )}
          </SectionCard>

          <SectionCard title='洞察'>
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
                      {insight.category} · 置信度 {Math.round(insight.confidence * 100)}%
                    </Text>
                    <View style={{ marginTop: '10px' }}>
                      <View onClick={() => handleAcknowledge(insight.id)} style={{ ...secondaryButtonStyle, opacity: acknowledge.isPending ? 0.7 : 1 }}>
                        <Text style={{ fontSize: '14px', color: colors.text }}>{acknowledge.isPending ? '处理中...' : '确认洞察'}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title='暂无洞察' description='可以点击上方“生成洞察”，让后端基于学习数据产出新的结论。' />
            )}
          </SectionCard>

          <SectionCard title='风格偏好'>
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
              <EmptyState title='暂无风格偏好' description='持续反馈穿搭后会出现风格偏好数据。' />
            )}
          </SectionCard>

          <SectionCard title='场景模式'>
            {data.profile.occasion_patterns.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.profile.occasion_patterns.map((item) => (
                  <View key={item.occasion} style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                    <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <Text style={{ fontSize: '14px', color: colors.text }}>{formatOccasionLabel(item.occasion)}</Text>
                      <Text style={{ fontSize: '12px', color: colors.textMuted }}>成功率 {Math.round(item.success_rate * 100)}%</Text>
                    </View>
                    {item.preferred_colors.length > 0 && (
                      <View style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {item.preferred_colors.map((c) => (
                          <Text key={c} style={{ fontSize: '11px', color: colors.textMuted, backgroundColor: '#27272a', padding: '2px 8px', borderRadius: '999px' }}>{formatColorLabel(c)}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title='暂无场景模式' description='不同场景的穿搭反馈积累后会出现规律。' />
            )}
          </SectionCard>

          <SectionCard title='天气偏好'>
            {data.profile.weather_preferences.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.profile.weather_preferences.map((item) => (
                  <View key={item.weather_type} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{WEATHER_LABELS[item.weather_type] ?? item.weather_type}</Text>
                    <Text style={{ fontSize: '12px', color: colors.textMuted }}>
                      {item.preferred_layers} 层 · 成功率 {Math.round(item.success_rate * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title='暂无天气偏好' description='不同天气条件的穿搭反馈积累后才能计算出偏好。' />
            )}
          </SectionCard>

          {data.preference_suggestions.suggestions && (
            <SectionCard title='偏好建议'>
              {data.preference_suggestions.suggestions.suggested_favorite_colors?.length ? (
                <View style={{ marginBottom: '12px' }}>
                  <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>推荐颜色</Text>
                  <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {data.preference_suggestions.suggestions.suggested_favorite_colors.map((c) => (
                      <Text key={c} style={{ fontSize: '11px', color: colors.success, backgroundColor: 'rgba(52, 211, 153, 0.12)', padding: '4px 10px', borderRadius: '999px' }}>{formatColorLabel(c)}</Text>
                    ))}
                  </View>
                </View>
              ) : null}
              {data.preference_suggestions.suggestions.suggested_avoid_colors?.length ? (
                <View style={{ marginBottom: '12px' }}>
                  <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>建议避免</Text>
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
