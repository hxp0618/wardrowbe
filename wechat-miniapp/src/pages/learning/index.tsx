import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { StatCard } from '../../components/stat-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import {
  useAcknowledgeInsight,
  useGenerateInsights,
  useLearning,
  useRecomputeLearning,
} from '../../hooks/use-learning'

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
      subtitle='这里先聚焦数据闭环：学习画像、最佳组合、洞察列表，以及重算/生成/确认动作。'
      actions={
        <View style={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleRecompute} loading={recompute.isPending}>重算</Button>
          <Button onClick={handleGenerateInsights} loading={generate.isPending}>生成洞察</Button>
        </View>
      }
    >
      {isLoading ? (
        <SectionCard title='加载中'>
          <Text style={{ fontSize: '22px', color: '#6B7280' }}>正在读取学习画像...</Text>
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
                      backgroundColor: '#F8FAFC',
                    }}
                  >
                    <Text style={{ fontSize: '22px', color: '#111827' }}>{item.color}</Text>
                    <Text style={{ fontSize: '20px', color: '#6B7280' }}>
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
                      backgroundColor: '#F8FAFC',
                    }}
                  >
                    <Text style={{ fontSize: '22px', color: '#111827' }}>
                      {pair.item1.name || pair.item1.type} + {pair.item2.name || pair.item2.type}
                    </Text>
                    <Text style={{ display: 'block', marginTop: '6px', fontSize: '20px', color: '#6B7280' }}>
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
                      backgroundColor: '#F8FAFC',
                    }}
                  >
                    <Text style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{insight.title}</Text>
                    <Text style={{ display: 'block', marginTop: '8px', fontSize: '22px', color: '#475569', lineHeight: 1.5 }}>
                      {insight.description}
                    </Text>
                    <Text style={{ display: 'block', marginTop: '8px', fontSize: '20px', color: '#6B7280' }}>
                      {insight.category} · 置信度 {Math.round(insight.confidence * 100)}%
                    </Text>
                    <View style={{ marginTop: '10px' }}>
                      <Button onClick={() => handleAcknowledge(insight.id)} loading={acknowledge.isPending}>
                        确认洞察
                      </Button>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title='暂无洞察' description='可以点击上方“生成洞察”，让后端基于学习数据产出新的结论。' />
            )}
          </SectionCard>
        </>
      )}
    </PageShell>
  )
}
