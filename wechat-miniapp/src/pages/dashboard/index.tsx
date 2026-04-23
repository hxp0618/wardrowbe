import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { StatCard } from '../../components/stat-card'
import { colors, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useAnalytics } from '../../hooks/use-analytics'
import { useAcceptOutfit, usePendingOutfits, useRejectOutfit, useWeather } from '../../hooks/use-outfits'
import { useSchedules, useNotificationSettings } from '../../hooks/use-notifications'
import { useFamily } from '../../hooks/use-family'
import { useUserProfile } from '../../hooks/use-user'
import { usePreferences } from '../../hooks/use-preferences'
import { formatNotificationChannelLabel, formatOccasionLabel, formatWeatherConditionLabel } from '../../lib/display'

function displayTemp(celsius: number, unit: string): string {
  if (unit === 'fahrenheit') return `${Math.round(celsius * 9 / 5 + 32)}°F`
  return `${Math.round(celsius)}°C`
}

export default function DashboardPage() {
  const canRender = useAuthGuard()
  const { data: userProfile } = useUserProfile()
  const { data: prefs } = usePreferences()
  const { data: weather, isLoading: weatherLoading } = useWeather()
  const { data: pendingData, isLoading: pendingLoading } = usePendingOutfits(3)
  const { data: analytics } = useAnalytics()
  const { data: schedules } = useSchedules()
  const { data: notifSettings } = useNotificationSettings()
  const { data: family } = useFamily()
  const acceptOutfit = useAcceptOutfit()
  const rejectOutfit = useRejectOutfit()
  const unit = prefs?.temperature_unit || 'celsius'

  if (!canRender) return null

  const greeting = userProfile?.display_name
    ? `你好，${userProfile.display_name.split(' ')[0]}`
    : '你好'

  const pendingOutfits = pendingData?.outfits || []

  // Next schedule
  const enabledSchedules = (schedules || []).filter((s) => s.enabled)
  const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  const handleAccept = async (id: string) => {
    try {
      await acceptOutfit.mutateAsync(id)
      void Taro.showToast({ title: '已接受', icon: 'success' })
    } catch { void Taro.showToast({ title: '操作失败', icon: 'none' }) }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectOutfit.mutateAsync(id)
      void Taro.showToast({ title: '已拒绝', icon: 'success' })
    } catch { void Taro.showToast({ title: '操作失败', icon: 'none' }) }
  }

  return (
    <PageShell title={greeting} subtitle='今天穿什么？' navKey='dashboard' useBuiltInTabBar>
      {/* Weather */}
      <SectionCard title='🌤️ 天气'>
        {weatherLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>加载天气中...</Text>
        ) : weather ? (
          <View>
            <View style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
              <Text style={{ fontSize: '34px', fontWeight: 700, color: colors.text }}>{displayTemp(weather.temperature, unit)}</Text>
              <Text style={{ fontSize: '13px', color: colors.textMuted }}>体感 {displayTemp(weather.feels_like, unit)}</Text>
            </View>
            <Text style={{ display: 'block', fontSize: '14px', color: colors.textMuted }}>{formatWeatherConditionLabel(weather.condition)}</Text>
            {weather.precipitation_chance > 0 && (
              <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft, marginTop: '4px' }}>
                💧 降水概率 {weather.precipitation_chance}%
              </Text>
            )}
            <View
              onClick={() => Taro.switchTab({ url: '/pages/suggest/index' })}
              style={{ ...primaryButtonStyle, marginTop: '14px' }}
            >
              <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>获取穿搭推荐</Text>
            </View>
          </View>
        ) : (
          <View>
            <Text style={{ display: 'block', fontSize: '14px', color: colors.textMuted, marginBottom: '10px' }}>未设置位置信息</Text>
            <View onClick={() => Taro.navigateTo({ url: '/pages/settings/index' })} style={secondaryButtonStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>设置位置</Text>
            </View>
          </View>
        )}
      </SectionCard>

      {/* Pending outfits */}
      <SectionCard
        title={pendingOutfits.length > 0 ? `⏳ 待确认 (${pendingData?.total || pendingOutfits.length})` : '✅ 全部处理完毕'}
        extra={
          (pendingData?.total ?? 0) > 3 ? (
            <View onClick={() => Taro.navigateTo({ url: '/pages/history/index' })}>
              <Text style={{ fontSize: '12px', color: colors.textMuted }}>查看全部</Text>
            </View>
          ) : null
        }
      >
        {pendingLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>加载中...</Text>
        ) : pendingOutfits.length === 0 ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>没有待处理的推荐</Text>
        ) : (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingOutfits.map((outfit) => (
              <View key={outfit.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '16px', backgroundColor: colors.surfaceMuted }}>
                <View style={{ display: 'flex' }}>
                  {outfit.items.slice(0, 3).map((item) => {
                    const imgUrl = item.thumbnail_url || item.image_url
                    return imgUrl ? (
                      <Image key={item.id} src={imgUrl} mode='aspectFill' style={{ width: '48px', height: '48px', borderRadius: '999px', backgroundColor: colors.surface, marginLeft: '-8px', border: `2px solid ${colors.surfaceMuted}` }} />
                    ) : (
                      <View key={item.id} style={{ width: '48px', height: '48px', borderRadius: '999px', backgroundColor: colors.surface, marginLeft: '-8px', border: `2px solid ${colors.surfaceMuted}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: '13px', color: colors.textSoft }}>{item.type.charAt(0)}</Text>
                      </View>
                    )
                  })}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: colors.text }}>
                    {formatOccasionLabel(outfit.occasion)}
                  </Text>
                  <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted }}>
                    {outfit.scheduled_for || '穿搭推荐'}
                  </Text>
                </View>
                <View style={{ display: 'flex', gap: '8px' }}>
                  <View onClick={() => handleReject(outfit.id)} style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(248, 113, 113, 0.12)' }}>
                    <Text style={{ fontSize: '14px', color: colors.danger }}>拒绝</Text>
                  </View>
                  <View onClick={() => handleAccept(outfit.id)} style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(52, 211, 153, 0.12)' }}>
                    <Text style={{ fontSize: '14px', color: colors.success }}>接受</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </SectionCard>

      {/* Weekly stats */}
      {analytics && (
        <SectionCard title='📊 本周概览'>
          <View style={{ display: 'flex', gap: '12px' }}>
            <StatCard label='本周穿搭' value={String(analytics.wardrobe.outfits_this_week)} />
            <StatCard
              label='接受率'
              value={analytics.wardrobe.acceptance_rate != null ? `${analytics.wardrobe.acceptance_rate}%` : '--'}
            />
          </View>
        </SectionCard>
      )}

      {/* Notification status */}
      <SectionCard title='🔔 通知状态'>
        {notifSettings && notifSettings.length > 0 ? (
          <View>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {notifSettings.map((ch) => (
                <Text key={ch.id} style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  color: ch.enabled ? colors.success : colors.textSoft,
                  backgroundColor: ch.enabled ? 'rgba(52, 211, 153, 0.12)' : colors.surfaceMuted,
                }}>
                  {ch.enabled ? '✓' : '✗'} {formatNotificationChannelLabel(ch.channel)}
                </Text>
              ))}
            </View>
            <Text style={{ fontSize: '12px', color: colors.textMuted }}>
              {notifSettings.filter((c) => c.enabled).length}/{notifSettings.length} 渠道已启用
            </Text>
          </View>
        ) : (
          <View>
            <Text style={{ display: 'block', fontSize: '14px', color: colors.textMuted, marginBottom: '10px' }}>还未配置通知渠道</Text>
            <View onClick={() => Taro.navigateTo({ url: '/pages/notifications/index' })} style={secondaryButtonStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>添加渠道</Text>
            </View>
          </View>
        )}
      </SectionCard>

      {/* Next schedule */}
      {enabledSchedules.length > 0 && (
        <SectionCard title='📅 下一次提醒'>
          <Text style={{ display: 'block', fontSize: '16px', fontWeight: 600, color: colors.text }}>
            {DAYS[enabledSchedules[0].day_of_week]} {enabledSchedules[0].notification_time.slice(0, 5)}
          </Text>
          <Text style={{ display: 'block', fontSize: '13px', color: colors.textMuted, marginTop: '4px' }}>
            {formatOccasionLabel(enabledSchedules[0].occasion)}
          </Text>
        </SectionCard>
      )}

      {/* Quick actions */}
      <SectionCard title='快捷操作'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <View onClick={() => Taro.switchTab({ url: '/pages/wardrobe/index' })} style={primaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>添加新单品</Text>
          </View>
          <View onClick={() => Taro.switchTab({ url: '/pages/suggest/index' })} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>获取穿搭推荐</Text>
          </View>
        </View>
      </SectionCard>

      {/* Family */}
      {family && (
        <SectionCard title='👨‍👩‍👧‍👦 家庭'>
          <Text style={{ display: 'block', fontSize: '14px', color: colors.textMuted, marginBottom: '10px' }}>
            {family.name} · {family.members.length} 位成员
          </Text>
          <View onClick={() => Taro.navigateTo({ url: '/pages/family-feed/index' })} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>浏览家庭动态</Text>
          </View>
        </SectionCard>
      )}

      {/* Insights */}
      {analytics && analytics.insights.length > 0 && (
        <SectionCard title='💡 洞察' extra={
          analytics.insights.length > 3 ? (
            <View onClick={() => Taro.navigateTo({ url: '/pages/analytics/index' })}>
              <Text style={{ fontSize: '12px', color: colors.textMuted }}>查看全部</Text>
            </View>
          ) : null
        }>
          <View style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {analytics.insights.slice(0, 3).map((insight, i) => (
              <View key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <View style={{ width: '6px', height: '6px', borderRadius: '999px', backgroundColor: colors.text, marginTop: '8px', flexShrink: 0 }} />
                <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{insight}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}
    </PageShell>
  )
}
