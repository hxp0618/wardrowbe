import { useState, type CSSProperties } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import {
  actionRowStyle,
  actionWrapRowStyle,
  getActionButtonStyle,
  getToneActionSurfaceStyle,
} from '../../components/action-style'
import { OutfitCard } from '../../components/outfit-card'
import { OutfitDetailSheet } from '../../components/outfit-detail-sheet'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { FlatSection } from '../../components/flat-data'
import {
  getEditorialCardStyle,
  getEditorialChipLabelStyle,
  getEditorialChipStyle,
} from '../../components/editorial-style'
import { colors } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useAnalytics } from '../../hooks/use-analytics'
import { usePendingOutfits, useWeather } from '../../hooks/use-outfits'
import { useSchedules, useNotificationSettings } from '../../hooks/use-notifications'
import { useFamily } from '../../hooks/use-family'
import { useUserProfile } from '../../hooks/use-user'
import { usePreferences } from '../../hooks/use-preferences'
import { formatWeekdayLabel } from '../../lib/date-utils'
import { formatNotificationChannelLabel, formatOccasionLabel, formatTemperature, formatWeatherConditionLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import { navigateToPage } from '../../lib/navigation'
import type { Outfit } from '../../services/types'
import {
  getWeatherErrorMessage,
  hasWeatherCoordinates,
  resolveWeatherPanelState,
} from '../../lib/weather-status'

function getSummaryShortcutStyle(withDivider: boolean): CSSProperties {
  return {
    flex: 1,
    minWidth: '0',
    padding: '10px 8px',
    borderRight: withDivider ? `1px solid ${colors.border}` : undefined,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  }
}

function SummaryShortcut(props: {
  label: string
  value: number | string
  hint: string
  withDivider?: boolean
  onClick: () => void
}) {
  return (
    <View
      ariaRole='button'
      ariaLabel={props.label}
      onClick={props.onClick}
      style={getSummaryShortcutStyle(!!props.withDivider)}
    >
      <Text style={{ display: 'block', fontSize: '11px', color: colors.textSoft }}>{props.label}</Text>
      <Text style={{ display: 'block', marginTop: '6px', fontSize: '24px', lineHeight: 1, fontWeight: 700, color: colors.text }}>
        {props.value}
      </Text>
      <Text style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: colors.textMuted }}>{props.hint}</Text>
    </View>
  )
}

function MetricCell(props: { label: string; value: string; withDivider?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        paddingRight: props.withDivider ? '12px' : undefined,
        borderRight: props.withDivider ? `1px solid ${colors.border}` : undefined,
      }}
    >
      <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted }}>{props.label}</Text>
      <Text style={{ display: 'block', marginTop: '6px', fontSize: '24px', fontWeight: 700, color: colors.text }}>
        {props.value}
      </Text>
    </View>
  )
}

export default function DashboardPage() {
  const canRender = useAuthGuard()
  const { data: userProfile, isLoading: userProfileLoading } = useUserProfile()
  const { data: prefs } = usePreferences()
  const hasSavedWeatherLocation = hasWeatherCoordinates(userProfile)
  const {
    data: weather,
    error: weatherError,
    isLoading: weatherQueryLoading,
    refetch: refetchWeather,
  } = useWeather(userProfile, !!userProfile)
  const { data: pendingData, isLoading: pendingLoading } = usePendingOutfits(3)
  const { data: analytics } = useAnalytics()
  const { data: schedules } = useSchedules()
  const { data: notifSettings } = useNotificationSettings()
  const { data: family } = useFamily()
  const [detailOutfit, setDetailOutfit] = useState<Outfit | null>(null)
  const { t, tf, greeting } = useI18n()
  const unit = prefs?.temperature_unit || 'celsius'

  if (!canRender) return null

  const pendingOutfits = pendingData?.outfits || []
  const totalItems = analytics?.wardrobe.total_items ?? 0
  const weatherErrorMessage = getWeatherErrorMessage(
    weatherError,
    t('dashboard_weather_error_fallback')
  )
  const weatherLoading = hasSavedWeatherLocation && weatherQueryLoading
  const weatherPanelState = resolveWeatherPanelState({
    profileLoading: userProfileLoading,
    weatherLoading,
    hasLocation: hasSavedWeatherLocation,
    hasWeather: !!weather,
    error: weatherError,
  })

  // Next schedule
  const enabledSchedules = (schedules || []).filter((s) => s.enabled)
  const navigateToWardrobe = () => Taro.switchTab({ url: '/pages/wardrobe/index' })
  const navigateToPendingHistory = () => navigateToPage('/pages/history/index?status=pending')
  const navigateToNotifications = () => navigateToPage('/pages/notifications/index')
  const navigateToAnalytics = () => navigateToPage('/pages/analytics/index')
  const navigateToFamilyFeed = () => navigateToPage('/pages/family-feed/index')

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
          ...getEditorialCardStyle(),
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <View>
          <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft }}>{t('dashboard_today_label')}</Text>
          <Text style={{ display: 'block', marginTop: '4px', fontSize: '20px', fontWeight: 700, color: colors.text }}>
            {weather
              ? t('dashboard_hero_ready_title')
              : weatherPanelState === 'error'
                ? t('dashboard_weather_error_status')
                : t('dashboard_hero_missing_title')}
          </Text>
          <Text style={{ display: 'block', marginTop: '6px', fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>
            {weather
              ? tf('dashboard_hero_summary_ready', {
                  temp: formatTemperature(weather.temperature, unit),
                  condition: formatWeatherConditionLabel(weather.condition),
                  count: totalItems,
                })
              : weatherPanelState === 'error'
                ? tf('dashboard_hero_summary_weather_error', {
                    message: weatherErrorMessage,
                    count: totalItems,
                  })
              : tf('dashboard_hero_summary_missing', { count: totalItems })}
          </Text>
        </View>
        <View style={actionWrapRowStyle}>
          <View style={getEditorialChipStyle(true)}>
            <Text style={getEditorialChipLabelStyle(true)}>
              {weather
                ? t('dashboard_weather_synced')
                : weatherPanelState === 'loading'
                  ? t('dashboard_weather_loading')
                  : weatherPanelState === 'error'
                    ? t('dashboard_weather_error_status')
                    : t('dashboard_weather_waiting')}
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
            paddingTop: '2px',
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <SummaryShortcut
            withDivider
            label={t('dashboard_stat_wardrobe')}
            value={totalItems}
            hint={t('dashboard_stat_wardrobe_hint')}
            onClick={navigateToWardrobe}
          />
          <SummaryShortcut
            withDivider
            label={t('dashboard_stat_pending')}
            value={pendingData?.total ?? pendingOutfits.length}
            hint={t('dashboard_stat_pending_hint')}
            onClick={navigateToPendingHistory}
          />
          <SummaryShortcut
            label={t('dashboard_stat_reminders')}
            value={enabledSchedules.length}
            hint={t('dashboard_stat_reminders_hint')}
            onClick={navigateToNotifications}
          />
        </View>
        <View style={{ ...actionRowStyle, gap: '10px' }}>
          <View ariaRole='button' ariaLabel={t('dashboard_add_item')} onClick={navigateToWardrobe} style={getActionButtonStyle({ variant: 'primary', compact: true, flex: 1 })}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{t('dashboard_add_item')}</Text>
          </View>
          <View ariaRole='button' ariaLabel={t('dashboard_get_suggestion')} onClick={() => Taro.switchTab({ url: '/pages/suggest/index' })} style={getActionButtonStyle({ compact: true, flex: 1 })}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('dashboard_get_suggestion')}</Text>
          </View>
        </View>
      </View>

      {/* Weather */}
      <SectionCard compact title={t('dashboard_weather_title')} style={getEditorialCardStyle()}>
        {weatherPanelState === 'loading' ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('dashboard_weather_loading')}</Text>
        ) : weather ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <View style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <Text style={{ fontSize: '28px', fontWeight: 700, color: colors.text }}>{formatTemperature(weather.temperature, unit)}</Text>
              <Text style={{ fontSize: '13px', color: colors.textMuted }}>{tf('dashboard_feels_like', { temp: formatTemperature(weather.feels_like, unit) })}</Text>
            </View>
            <Text style={{ display: 'block', fontSize: '14px', color: colors.textMuted }}>{formatWeatherConditionLabel(weather.condition)}</Text>
            {weather.precipitation_chance > 0 && (
              <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft, marginTop: '4px' }}>
                {tf('dashboard_precipitation', { value: weather.precipitation_chance })}
              </Text>
            )}
            <View
              ariaRole='button'
              ariaLabel={t('dashboard_get_suggestion')}
              onClick={() => Taro.switchTab({ url: '/pages/suggest/index' })}
              style={{ ...getActionButtonStyle({ variant: 'primary', compact: true }), marginTop: '8px' }}
            >
              <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{t('dashboard_get_suggestion')}</Text>
            </View>
          </View>
        ) : weatherPanelState === 'error' ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Text style={{ display: 'block', fontSize: '14px', color: colors.danger, marginBottom: '4px' }}>
              {tf('dashboard_weather_error', { message: weatherErrorMessage })}
            </Text>
            <View
              ariaRole='button'
              ariaLabel={t('dashboard_weather_retry')}
              onClick={() => void refetchWeather()}
              style={getActionButtonStyle({ compact: true })}
            >
              <Text style={{ fontSize: '14px', color: colors.text }}>{t('dashboard_weather_retry')}</Text>
            </View>
          </View>
        ) : (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Text style={{ display: 'block', fontSize: '14px', color: colors.textMuted, marginBottom: '10px' }}>{t('dashboard_location_missing')}</Text>
            <View
              ariaRole='button'
              ariaLabel={t('dashboard_set_location')}
              onClick={() => Taro.switchTab({ url: '/pages/settings/index' })}
              style={getActionButtonStyle({ compact: true })}
            >
              <Text style={{ fontSize: '14px', color: colors.text }}>{t('dashboard_set_location')}</Text>
            </View>
          </View>
        )}
      </SectionCard>

      {/* Pending outfits */}
      <FlatSection
        title={pendingOutfits.length > 0 ? tf('dashboard_pending_title', { count: pendingData?.total || pendingOutfits.length }) : t('dashboard_pending_empty_title')}
        extra={
         (pendingData?.total ?? 0) > 3 ? (
            <View ariaRole='button' ariaLabel={t('dashboard_view_all')} onClick={navigateToPendingHistory}>
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
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingOutfits.map((outfit) => (
              <View
                key={outfit.id}
                ariaRole='button'
                ariaLabel={t('dashboard_view_detail')}
                onClick={() => setDetailOutfit(outfit)}
              >
                <OutfitCard outfit={outfit} />
              </View>
            ))}
          </View>
        )}
      </FlatSection>

      {/* Weekly stats */}
      {analytics && (
        <SectionCard
          compact
          title={t('dashboard_weekly_overview_title')}
          ariaLabel={t('dashboard_weekly_overview_title')}
          onClick={navigateToAnalytics}
          style={getEditorialCardStyle()}
        >
          <View style={{ display: 'flex', gap: '12px' }}>
            <MetricCell
              withDivider
              label={t('dashboard_weekly_outfits')}
              value={String(analytics.wardrobe.outfits_this_week)}
            />
            <MetricCell
              label={t('dashboard_acceptance_rate')}
              value={analytics.wardrobe.acceptance_rate != null ? `${analytics.wardrobe.acceptance_rate}%` : '--'}
            />
          </View>
        </SectionCard>
      )}

      {/* Notification status */}
      <SectionCard
        compact
        title={t('dashboard_notification_status_title')}
        ariaLabel={t('dashboard_notification_status_title')}
        onClick={navigateToNotifications}
        style={getEditorialCardStyle()}
      >
        {notifSettings && notifSettings.length > 0 ? (
          <View>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {notifSettings.map((ch) => (
                <Text key={ch.id} style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  color: ch.enabled ? colors.success : colors.textSoft,
                  ...(ch.enabled ? getToneActionSurfaceStyle('success') : { backgroundColor: colors.surfaceMuted }),
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
            <View style={getActionButtonStyle({ compact: true })}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{t('dashboard_add_channel')}</Text>
            </View>
          </View>
        )}
      </SectionCard>

      {/* Next schedule */}
      {enabledSchedules.length > 0 && (
        <SectionCard
          compact
          title={t('dashboard_next_schedule_title')}
          ariaLabel={t('dashboard_next_schedule_title')}
          onClick={navigateToNotifications}
          style={getEditorialCardStyle()}
        >
          <Text style={{ display: 'block', fontSize: '16px', fontWeight: 600, color: colors.text }}>
            {formatWeekdayLabel(enabledSchedules[0].day_of_week)} {enabledSchedules[0].notification_time.slice(0, 5)}
          </Text>
          <Text style={{ display: 'block', fontSize: '13px', color: colors.textMuted, marginTop: '4px' }}>
            {formatOccasionLabel(enabledSchedules[0].occasion)}
          </Text>
        </SectionCard>
      )}

      {/* Family */}
      {family && (
        <SectionCard
          compact
          title={t('dashboard_family_title')}
          ariaLabel={t('dashboard_family_title')}
          onClick={navigateToFamilyFeed}
          style={getEditorialCardStyle()}
        >
          <Text style={{ display: 'block', fontSize: '14px', color: colors.textMuted, marginBottom: '10px' }}>
            {tf('dashboard_family_members_summary', { name: family.name, count: family.members.length })}
          </Text>
          <View style={getActionButtonStyle({ compact: true })}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('dashboard_family_browse')}</Text>
          </View>
        </SectionCard>
      )}

      {/* Insights */}
      {analytics && analytics.insights.length > 0 && (
        <SectionCard compact title={t('dashboard_insights_title')} ariaLabel={t('dashboard_insights_title')} onClick={navigateToAnalytics} style={getEditorialCardStyle()} extra={
          analytics.insights.length > 3 ? (
            <View ariaRole='button' ariaLabel={t('dashboard_view_all')} onClick={navigateToAnalytics}>
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
      <OutfitDetailSheet outfit={detailOutfit} visible={!!detailOutfit} onClose={() => setDetailOutfit(null)} />
    </PageShell>
  )
}
