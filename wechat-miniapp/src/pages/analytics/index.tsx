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

const DAY_OPTIONS = ['30 天', '60 天', '90 天']
const DAY_VALUES = [30, 60, 90]

export default function AnalyticsPage() {
  const canRender = useAuthGuard()
  const [dayIndex, setDayIndex] = useState(1)
  const days = DAY_VALUES[dayIndex]
  const { data, isLoading } = useAnalytics(days)

  if (!canRender) {
    return null
  }

  return (
    <PageShell title='分析' subtitle='衣橱数据统计与趋势' navKey='dashboard'>
      <SectionCard title='范围'>
        <Picker mode='selector' range={DAY_OPTIONS} value={dayIndex} onChange={(event) => setDayIndex(Number(event.detail.value))}>
          <View style={inputStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{DAY_OPTIONS[dayIndex]}</Text>
          </View>
        </Picker>
      </SectionCard>

      {isLoading ? (
        <SectionCard title='加载中'>
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>正在计算分析数据...</Text>
        </SectionCard>
      ) : !data ? (
        <SectionCard title='分析结果'>
          <EmptyState title='还没有可展示的分析数据' description='随着单品和穿搭记录增加，这里会逐步出现统计、趋势和洞察。' />
        </SectionCard>
      ) : (
        <>
          <SectionCard title='核心指标'>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <StatCard label='总单品' value={String(data.wardrobe.total_items)} />
              <StatCard label='总穿搭' value={String(data.wardrobe.total_outfits)} />
              <StatCard
                label='接受率'
                value={data.wardrobe.acceptance_rate == null ? '--' : `${data.wardrobe.acceptance_rate}%`}
              />
              <StatCard
                label='平均评分'
                value={data.wardrobe.average_rating == null ? '--' : String(data.wardrobe.average_rating)}
              />
            </View>
          </SectionCard>

          <SectionCard title='颜色分布'>
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
                      {item.count} 件 · {item.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title='暂无颜色分布' description='准备就绪的单品越多，这里的颜色统计越有意义。' />
            )}
          </SectionCard>

          <SectionCard title='类型分布'>
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
                      {item.count} 件 · {item.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title='暂无类型分布' description='单品类型统计会直接复用后端 analytics 输出。' />
            )}
          </SectionCard>

          <SectionCard title='洞察'>
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
              <EmptyState title='暂无洞察' description='随着反馈积累，analytics 会输出更多可读的整体结论。' />
            )}
          </SectionCard>

          <SectionCard title='穿着最多'>
            {data.most_worn.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.most_worn.slice(0, 5).map((item) => (
                  <View key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{item.name || formatItemTypeLabel(item.type)}</Text>
                    <Text style={{ fontSize: '12px', color: colors.textMuted }}>{item.wear_count} 次</Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title='暂无数据' description='穿着记录增加后会自动统计。' />
            )}
          </SectionCard>

          <SectionCard title='穿着最少'>
            {data.least_worn.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.least_worn.slice(0, 5).map((item) => (
                  <View key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{item.name || formatItemTypeLabel(item.type)}</Text>
                    <Text style={{ fontSize: '12px', color: colors.textMuted }}>{item.wear_count} 次</Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title='暂无数据' description='需要更多穿着记录。' />
            )}
          </SectionCard>

          <SectionCard title='从未穿过'>
            {data.never_worn.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.never_worn.slice(0, 5).map((item) => (
                  <View key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', backgroundColor: 'rgba(251, 191, 36, 0.12)' }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{item.name || formatItemTypeLabel(item.type)}</Text>
                    <Text style={{ fontSize: '12px', color: colors.warning }}>未穿</Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title='太棒了' description='你的每件单品都穿过了！' />
            )}
          </SectionCard>
        </>
      )}
    </PageShell>
  )
}
