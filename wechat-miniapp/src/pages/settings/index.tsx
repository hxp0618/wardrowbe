import { useState, useEffect } from 'react'
import { Input, Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { StatCard } from '../../components/stat-card'
import { UIBadge } from '../../components/ui-badge'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useNotificationSettings } from '../../hooks/use-notifications'
import { useUpdatePreferences, usePreferences } from '../../hooks/use-preferences'
import { useUpdateUserProfile, useUserProfile } from '../../hooks/use-user'
import { formatOccasionLabel, formatRoleLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { colors, inputStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'

const OCCASIONS = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const TEMPERATURE_UNITS = ['celsius', 'fahrenheit']
const TIMEZONES = ['Asia/Shanghai', 'Asia/Tokyo', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'UTC']

export default function SettingsPage() {
  const canRender = useAuthGuard()
  const { data: userProfile } = useUserProfile()
  const { data: prefs } = usePreferences()
  const { data: notificationSettings } = useNotificationSettings()
  const updateProfile = useUpdateUserProfile()
  const updatePrefs = useUpdatePreferences()
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const [displayName, setDisplayName] = useState('')
  const [locationName, setLocationName] = useState('')
  const [occasionIndex, setOccasionIndex] = useState(0)
  const [tempUnitIndex, setTempUnitIndex] = useState(0)
  const [timezoneIndex, setTimezoneIndex] = useState(0)
  const { t, tf, locale } = useI18n()
  const tempUnitLabels: Record<string, string> =
    locale === 'en'
      ? { celsius: 'Celsius', fahrenheit: 'Fahrenheit' }
      : { celsius: '摄氏', fahrenheit: '华氏' }
  const occasionOptions =
    locale === 'en'
      ? ['Casual', 'Office', 'Formal', 'Date', 'Sporty', 'Outdoor']
      : ['休闲', '办公', '正式', '约会', '运动', '户外']

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.display_name)
      setLocationName(userProfile.location_name || '')
      const tzIndex = TIMEZONES.indexOf(userProfile.timezone)
      if (tzIndex >= 0) {
        setTimezoneIndex(tzIndex)
      }
    }
  }, [userProfile])

  useEffect(() => {
    if (prefs) {
      const oi = OCCASIONS.indexOf(prefs.default_occasion)
      if (oi >= 0) setOccasionIndex(oi)
      const ti = TEMPERATURE_UNITS.indexOf(prefs.temperature_unit)
      if (ti >= 0) setTempUnitIndex(ti)
    }
  }, [prefs])

  if (!canRender) return null

  const notificationCount = notificationSettings?.length ?? 0
  const enabledNotificationCount = notificationSettings?.filter((setting) => setting.enabled).length ?? 0

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        location_name: locationName,
        timezone: TIMEZONES[timezoneIndex],
      })
      void Taro.showToast({ title: t('settings_toast_profile_updated'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('settings_toast_update_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleSavePrefs = async () => {
    try {
      await updatePrefs.mutateAsync({
        default_occasion: OCCASIONS[occasionIndex],
        temperature_unit: TEMPERATURE_UNITS[tempUnitIndex] as 'celsius' | 'fahrenheit',
      })
      void Taro.showToast({ title: t('settings_toast_preferences_updated'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('settings_toast_update_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleLogout = () => {
    Taro.removeStorageSync('accessToken')
    setAccessToken(null)
    void Taro.redirectTo({ url: '/pages/login/index' })
  }

  return (
    <PageShell title={t('page_settings_title')} subtitle={t('page_settings_subtitle')} navKey='settings' useBuiltInTabBar>
      <View style={{ display: 'flex', gap: '12px' }}>
        <StatCard
          label={t('settings_stat_channels_label')}
          value={String(notificationCount)}
          hint={
            notificationCount
              ? tf('settings_stat_channels_hint_enabled', { enabled: enabledNotificationCount })
              : t('settings_stat_channels_hint_empty')
          }
        />
        <StatCard
          label={t('settings_stat_family_label')}
          value={userProfile?.family_id ? t('settings_family_joined') : t('settings_family_not_joined')}
          hint={
            userProfile?.role
              ? tf('settings_family_role_hint', { role: formatRoleLabel(userProfile.role) })
              : t('settings_family_solo_hint')
          }
        />
      </View>

      <SectionCard title={t('settings_account_summary_title')}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <UIBadge
              label={
                userProfile?.onboarding_completed
                  ? t('settings_badge_onboarding_done')
                  : t('settings_badge_onboarding_pending')
              }
              tone={userProfile?.onboarding_completed ? 'success' : 'warning'}
            />
            <UIBadge label={TIMEZONES[timezoneIndex] || userProfile?.timezone || 'UTC'} />
            <UIBadge label={tempUnitLabels[TEMPERATURE_UNITS[tempUnitIndex]]} />
          </View>
          {userProfile?.email ? (
            <View style={{ padding: '10px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
              <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted }}>{t('settings_email_label')}</Text>
              <Text style={{ display: 'block', marginTop: '4px', fontSize: '14px', color: colors.text }}>
                {userProfile.email}
              </Text>
            </View>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard title={t('settings_profile_title')}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>{t('settings_display_name_label')}</Text>
            <Input value={displayName} onInput={(e) => setDisplayName(e.detail.value)} style={inputStyle} />
          </View>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>{t('settings_location_label')}</Text>
            <Input
              value={locationName}
              placeholder={t('settings_location_placeholder')}
              onInput={(e) => setLocationName(e.detail.value)}
              style={inputStyle}
            />
          </View>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>{t('settings_timezone_label')}</Text>
            <Picker mode='selector' range={TIMEZONES} value={timezoneIndex} onChange={(e) => setTimezoneIndex(Number(e.detail.value))}>
              <View style={inputStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{TIMEZONES[timezoneIndex]}</Text>
              </View>
            </Picker>
          </View>
          <View onClick={handleSaveProfile} style={{ ...primaryButtonStyle, opacity: updateProfile.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
              {updateProfile.isPending ? t('settings_saving') : t('settings_save_profile')}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title={t('settings_preferences_title')}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>{t('settings_default_occasion_label')}</Text>
            <Picker mode='selector' range={occasionOptions} value={occasionIndex} onChange={(e) => setOccasionIndex(Number(e.detail.value))}>
              <View style={inputStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{occasionOptions[occasionIndex]}</Text>
              </View>
            </Picker>
          </View>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>{t('settings_temperature_unit_label')}</Text>
            <Picker mode='selector' range={TEMPERATURE_UNITS.map((unit) => tempUnitLabels[unit])} value={tempUnitIndex} onChange={(e) => setTempUnitIndex(Number(e.detail.value))}>
              <View style={inputStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{tempUnitLabels[TEMPERATURE_UNITS[tempUnitIndex]]}</Text>
              </View>
            </Picker>
          </View>
          <View onClick={handleSavePrefs} style={{ ...primaryButtonStyle, opacity: updatePrefs.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
              {updatePrefs.isPending ? t('settings_saving') : t('settings_save_preferences')}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title={t('settings_shortcuts_title')}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <View onClick={() => Taro.navigateTo({ url: '/pages/notifications/index' })} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('settings_shortcut_notifications')}</Text>
          </View>
          <View onClick={() => Taro.navigateTo({ url: '/pages/family/index' })} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('settings_shortcut_family')}</Text>
          </View>
          <View onClick={() => Taro.navigateTo({ url: '/pages/learning/index' })} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('settings_shortcut_learning')}</Text>
          </View>
          <View onClick={() => Taro.navigateTo({ url: '/pages/analytics/index' })} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('settings_shortcut_analytics')}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title={t('settings_account_title')}>
        <View onClick={handleLogout} style={{ ...secondaryButtonStyle, backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)' }}>
          <Text style={{ fontSize: '14px', color: colors.danger }}>{t('settings_logout')}</Text>
        </View>
      </SectionCard>
    </PageShell>
  )
}
