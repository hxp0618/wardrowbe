import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import {
  getEditorialCardStyle,
  getEditorialChipLabelStyle,
  getEditorialChipStyle,
  getEditorialCompactButtonStyle,
  getEditorialFeatureCardStyle,
  getEditorialTintedPanelStyle,
} from '../../components/editorial-style'
import { colors, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useAnalytics } from '../../hooks/use-analytics'
import { useAcceptOutfit, usePendingOutfits, useRejectOutfit, useWeather } from '../../hooks/use-outfits'
import { useSchedules, useNotificationSettings } from '../../hooks/use-notifications'
import { useFamily } from '../../hooks/use-family'
import { useUserProfile } from '../../hooks/use-user'
import { usePreferences } from '../../hooks/use-preferences'
import { formatNotificationChannelLabel, formatOccasionLabel, formatWeatherConditionLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'

function displayTemp(celsius: number, unit: string): string {
  if (unit === 'fahrenheit') return `${Math.round(celsius * 9 / 5 + 32)}°F`
  return `${Math.round(celsius)}°C`
}

function getWeekdayLabel(dayOfWeek: number): string {
  const baseDate = new Date(Date.UTC(2024, 0, 7 + dayOfWeek))
  return new Intl.DateTimeFormat('zh-CN', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(baseDate)
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
  const { t, tf, greeting } = useI18n()
  const unit = prefs?.temperature_unit || 'celsius'

  if (!canRender) return null

  const pendingOutfits = pendingData?.outfits || []
  const totalItems = analytics?.wardrobe.total_items ?? 0

  // Next schedule
  const enabledSchedules = (schedules || []).filter((s) => s.enabled)
  const handleAccept = async (id: string) => {
    try {
      await acceptOutfit.mutateAsync(id)
      void Taro.showToast({ title: t('dashboard_toast_accept_success'), icon: 'success' })
    } catch { void Taro.showToast({ title: t('dashboard_toast_action_failed'), icon: 'none' }) }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectOutfit.mutateAsync(id)
      void Taro.showToast({ title: t('dashboard_toast_reject_success'), icon: 'success' })
    } catch { void Taro.showToast({ title: t('dashboard_toast_action_failed'), icon: 'none' }) }
  }

  return (
    <PageShell
      title={greeting(userProfile?.display_name)}
      subtitle={t('page_dashboard_subtitle')}
      navKey='dashboard'
      useBuiltInTabBar
      hideHeaderProfileBadge
    >
      <View
        style={{
          ...getEditorialFeatureCardStyle(),
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <View>
          <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft }}>{t('dashboard_today_label')}</Text>
          <Text style={{ display: 'block', marginTop: '6px', fontSize: '24px', fontWeight: 700, color: colors.text }}>
            {weather ? t('dashboard_hero_ready_title') : t('dashboard_hero_missing_title')}
          </Text>
          <Text style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
            {weather
              ? tf('dashboard_hero_summary_ready', {
                  temp: displayTemp(weather.temperature, unit),
                  condition: formatWeatherConditionLabel(weather.condition),
                  count: totalItems,
                })
              : tf('dashboard_hero_summary_missing', { count: totalItems })}
          </Text>
        </View>
        <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <View style={getEditorialChipStyle(true)}>
            <Text style={getEditorialChipLabelStyle(true)}>
              {weather ? t('dashboard_weather_synced') : t('dashboard_weather_waiting')}
            </Text>
          </View>
          <View style={getEditorialChipStyle(false, 'warning')}>
            <Text style={getEditorialChipLabelStyle(false)}>
              {family
                ? tf('dashboard_family_members', { name: family.name, count: family.members.length })
                : t('dashboard_family_connected')}
            </Text>
          </View>
        </View>
        <View
          style={{
            display: 'flex',
            marginTop: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.82)',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flex: 1,
              minWidth: '0',
              padding: '14px 10px 12px',
              borderRight: `1px solid ${colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Text style={{ display: 'block', fontSize: '11px', color: colors.textSoft }}>{t('dashboard_stat_wardrobe')}</Text>
            <Text style={{ display: 'block', marginTop: '8px', fontSize: '32px', lineHeight: 1, fontWeight: 700, color: colors.text }}>
              {totalItems}
            </Text>
            <Text style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: colors.textMuted }}>{t('dashboard_stat_wardrobe_hint')}</Text>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: '0',
              padding: '14px 10px 12px',
              borderRight: `1px solid ${colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Text style={{ display: 'block', fontSize: '11px', color: colors.textSoft }}>{t('dashboard_stat_pending')}</Text>
            <Text style={{ display: 'block', marginTop: '8px', fontSize: '32px', lineHeight: 1, fontWeight: 700, color: colors.text }}>
              {pendingData?.total ?? pendingOutfits.length}
            </Text>
            <Text style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: colors.textMuted }}>{t('dashboard_stat_pending_hint')}</Text>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: '0',
              padding: '14px 10px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Text style={{ display: 'block', fontSize: '11px', color: colors.textSoft }}>{t('dashboard_stat_reminders')}</Text>
            <Text style={{ display: 'block', marginTop: '8px', fontSize: '32px', lineHeight: 1, fontWeight: 700, color: colors.text }}>
              {enabledSchedules.length}
            </Text>
            <Text style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: colors.textMuted }}>{t('dashboard_stat_reminders_hint')}</Text>
          </View>
        </View>
        <View style={{ display: 'flex', gap: '10px' }}>
          <View onClick={() => Taro.switchTab({ url: '/pages/wardrobe/index' })} style={{ ...primaryButtonStyle, ...getEditorialCompactButtonStyle(), flex: 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{t('dashboard_add_item')}</Text>
          </View>
          <View onClick={() => Taro.switchTab({ url: '/pages/suggest/index' })} style={{ ...secondaryButtonStyle, ...getEditorialCompactButtonStyle(), flex: 1 }}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('dashboard_get_suggestion')}</Text>
          </View>
        </View>
      </View>

      {/* Weather */}
      <SectionCard title={t('dashboard_weather_title')} style={getEditorialCardStyle()}>
        {weatherLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('dashboard_weather_loading')}</Text>
        ) : weather ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <View style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
              <Text style={{ fontSize: '34px', fontWeight: 700, color: colors.text }}>{displayTemp(weather.temperature, unit)}</Text>
              <Text style={{ fontSize: '13px', color: colors.textMuted }}>{tf('dashboard_feels_like', { temp: displayTemp(weather.feels_like, unit) })}</Text>
            </View>
            <Text style={{ display: 'block', fontSize: '14px', color: colors.textMuted }}>{formatWeatherConditionLabel(weather.condition)}</Text>
            {weather.precipitation_chance > 0 && (
              <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft, marginTop: '4px' }}>
                {tf('dashboard_precipitation', { value: weather.precipitation_chance })}
              </Text>
            )}
            <View
              onClick={() => Taro.switchTab({ url: '/pages/suggest/index' })}
              style={{ ...primaryButtonStyle, ...getEditorialCompactButtonStyle(), marginTop: '14px' }}
            >
              <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{t('dashboard_get_suggestion')}</Text>
            </View>
          </View>
        ) : (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Text style={{ display: 'block', fontSize: '14px', color: colors.textMuted, marginBottom: '10px' }}>{t('dashboard_location_missing')}</Text>
            <View
              onClick={() => Taro.switchTab({ url: '/pages/settings/index' })}
              style={{ ...secondaryButtonStyle, ...getEditorialCompactButtonStyle() }}
            >
              <Text style={{ fontSize: '14px', color: colors.text }}>{t('dashboard_set_location')}</Text>
            </View>
          </View>
        )}
      </SectionCard>

      {/* Pending outfits */}
      <SectionCard
        title={pendingOutfits.length > 0 ? tf('dashboard_pending_title', { count: pendingData?.total || pendingOutfits.length }) : t('dashboard_pending_empty_title')}
        style={getEditorialCardStyle()}
        extra={
          (pendingData?.total ?? 0) > 3 ? (
            <View onClick={() => Taro.navigateTo({ url: '/pages/history/index' })}>
              <Text style={{ fontSize: '12px', color: colors.textMuted }}>{t('dashboard_view_all')}</Text>
            </View>
          ) : null
        }
      >
        {pendingLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('dashboard_loading')}</Text>
        ) : pendingOutfits.length === 0 ? (
          <View style={{ paddingLeft: '2px' }}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('dashboard_pending_empty_title')}</Text>
            <Text style={{ display: 'block', marginTop: '6px', fontSize: '13px', color: colors.textMuted }}>
              {t('dashboard_pending_empty')}
            </Text>
          </View>
        ) : (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingOutfits.map((outfit, index) => (
              <View
                key={outfit.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom: index === pendingOutfits.length - 1 ? 'none' : `1px solid ${colors.border}`,
                }}
              >
                <View style={{ display: 'flex' }}>
                  {outfit.items.slice(0, 3).map((item) => {
                    const imgUrl = item.thumbnail_url || item.image_url
                    return imgUrl ? (
                      <Image key={item.id} src={imgUrl} mode='aspectFill' style={{ width: '48px', height: '48px', borderRadius: '999px', backgroundColor: colors.surface, marginLeft: '-8px', border: `2px solid ${colors.page}` }} />
                    ) : (
                      <View key={item.id} style={{ width: '48px', height: '48px', borderRadius: '999px', backgroundColor: colors.surface, marginLeft: '-8px', border: `2px solid ${colors.page}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    {outfit.scheduled_for || t('dashboard_outfit_fallback')}
                  </Text>
                </View>
                <View style={{ display: 'flex', gap: '8px' }}>
                  <View onClick={() => handleReject(outfit.id)} style={getEditorialChipStyle(false, 'warning')}>
                    <Text style={getEditorialChipLabelStyle(false)}>{t('dashboard_reject')}</Text>
                  </View>
                  <View onClick={() => handleAccept(outfit.id)} style={getEditorialChipStyle(true)}>
                    <Text style={getEditorialChipLabelStyle(true)}>{t('dashboard_accept')}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </SectionCard>

      {/* Weekly stats */}
      {analytics && (
        <SectionCard title={t('dashboard_weekly_overview_title')} style={getEditorialCardStyle()}>
          <View style={{ display: 'flex', gap: '12px' }}>
            <View style={{ flex: 1, paddingRight: '12px', borderRight: `1px solid ${colors.border}` }}>
              <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted }}>
                {t('dashboard_weekly_outfits')}
              </Text>
              <Text style={{ display: 'block', marginTop: '8px', fontSize: '28px', fontWeight: 700, color: colors.text }}>
                {String(analytics.wardrobe.outfits_this_week)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted }}>
                {t('dashboard_acceptance_rate')}
              </Text>
              <Text style={{ display: 'block', marginTop: '8px', fontSize: '28px', fontWeight: 700, color: colors.text }}>
                {analytics.wardrobe.acceptance_rate != null ? `${analytics.wardrobe.acceptance_rate}%` : '--'}
              </Text>
            </View>
          </View>
        </SectionCard>
      )}

      {/* Notification status */}
      <SectionCard title={t('dashboard_notification_status_title')} style={getEditorialCardStyle()}>
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
                  {ch.enabled
                    ? tf('dashboard_notification_enabled', { channel: formatNotificationChannelLabel(ch.channel) })
                    : tf('dashboard_notification_disabled', { channel: formatNotificationChannelLabel(ch.channel) })}
                </Text>
              ))}
            </View>
            <Text style={{ fontSize: '12px', color: colors.textMuted }}>
              {tf('dashboard_notification_summary', {
                enabled: notifSettings.filter((c) => c.enabled).length,
                total: notifSettings.length,
              })}
            </Text>
          </View>
        ) : (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Text style={{ display: 'block', fontSize: '14px', color: colors.textMuted, marginBottom: '10px' }}>{t('dashboard_notification_empty')}</Text>
            <View onClick={() => Taro.navigateTo({ url: '/pages/notifications/index' })} style={{ ...secondaryButtonStyle, ...getEditorialCompactButtonStyle() }}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{t('dashboard_add_channel')}</Text>
            </View>
          </View>
        )}
      </SectionCard>

      {/* Next schedule */}
      {enabledSchedules.length > 0 && (
        <SectionCard title={t('dashboard_next_schedule_title')} style={getEditorialCardStyle()}>
          <Text style={{ display: 'block', fontSize: '16px', fontWeight: 600, color: colors.text }}>
            {getWeekdayLabel(enabledSchedules[0].day_of_week)} {enabledSchedules[0].notification_time.slice(0, 5)}
          </Text>
          <Text style={{ display: 'block', fontSize: '13px', color: colors.textMuted, marginTop: '4px' }}>
            {formatOccasionLabel(enabledSchedules[0].occasion)}
          </Text>
        </SectionCard>
      )}

      {/* Quick actions */}
      <SectionCard title={t('dashboard_quick_actions_title')} style={getEditorialCardStyle()}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <View
            onClick={() => Taro.switchTab({ url: '/pages/wardrobe/index' })}
            style={{
              paddingBottom: '14px',
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft }}>WARDROBE</Text>
            <Text style={{ display: 'block', marginTop: '8px', fontSize: '16px', fontWeight: 700, color: colors.text }}>{t('dashboard_add_item')}</Text>
            <Text style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: colors.textMuted, lineHeight: 1.6 }}>{t('dashboard_quick_add_description')}</Text>
          </View>
          <View
            onClick={() => Taro.switchTab({ url: '/pages/suggest/index' })}
            style={{
              paddingTop: '2px',
            }}
          >
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft }}>SUGGEST</Text>
            <Text style={{ display: 'block', marginTop: '8px', fontSize: '16px', fontWeight: 700, color: colors.text }}>{t('dashboard_get_suggestion')}</Text>
            <Text style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: colors.textMuted, lineHeight: 1.6 }}>{t('dashboard_quick_suggest_description')}</Text>
          </View>
        </View>
      </SectionCard>

      {/* Family */}
      {family && (
        <SectionCard title={t('dashboard_family_title')} style={getEditorialCardStyle()}>
          <Text style={{ display: 'block', fontSize: '14px', color: colors.textMuted, marginBottom: '10px' }}>
            {tf('dashboard_family_members_summary', { name: family.name, count: family.members.length })}
          </Text>
          <View onClick={() => Taro.navigateTo({ url: '/pages/family-feed/index' })} style={{ ...secondaryButtonStyle, ...getEditorialCompactButtonStyle() }}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('dashboard_family_browse')}</Text>
          </View>
        </SectionCard>
      )}

      {/* Insights */}
      {analytics && analytics.insights.length > 0 && (
        <SectionCard title={t('dashboard_insights_title')} style={getEditorialCardStyle()} extra={
          analytics.insights.length > 3 ? (
            <View onClick={() => Taro.navigateTo({ url: '/pages/analytics/index' })}>
              <Text style={{ fontSize: '12px', color: colors.textMuted }}>{t('dashboard_view_all')}</Text>
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
