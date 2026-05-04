import { useState, useEffect } from 'react'
import { Input, Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { CompactOptionGroup } from '../../components/compact-option-group'
import { actionWrapRowStyle, getActionButtonStyle, getEnabledActionHandler } from '../../components/action-style'
import { FlatList, FlatListRow, FlatMetricGrid } from '../../components/flat-data'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { UIBadge } from '../../components/ui-badge'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useNotificationSettings } from '../../hooks/use-notifications'
import { useUpdatePreferences, usePreferences } from '../../hooks/use-preferences'
import { useUpdateUserProfile, useUserProfile } from '../../hooks/use-user'
import { formatOccasionLabel, formatRoleLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import { OCCASION_VALUES, TEMPERATURE_UNIT_VALUES } from '../../lib/options'
import { geocodeWeatherLocation } from '../../services/outfits'
import {
  applyManualLocationName,
  buildUserProfileUpdate,
  hasResolvedLocation,
  resolveLocationDraftForSave,
  toResolvedLocationDraft,
} from '../../lib/location-form'
import { navigateToPage } from '../../lib/navigation'
import { clearStoredAccessToken } from '../../lib/storage'
import { TIMEZONE_OPTIONS, findTimezoneOption } from '../../lib/timezone-options'
import { chooseWechatLocation, WechatLocationError } from '../../lib/wechat-location'
import { useAuthStore } from '../../stores/auth'
import { colors, inputStyle } from '../../components/ui-theme'

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
  const [locationLat, setLocationLat] = useState<number | undefined>(undefined)
  const [locationLon, setLocationLon] = useState<number | undefined>(undefined)
  const [occasionIndex, setOccasionIndex] = useState(0)
  const [tempUnitIndex, setTempUnitIndex] = useState(0)
  const [timezoneIndex, setTimezoneIndex] = useState(0)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const { t, tf } = useI18n()
  const tempUnitLabels: Record<string, string> = { celsius: '摄氏', fahrenheit: '华氏' }
  const occasionOptions = OCCASION_VALUES.map((occasion) => formatOccasionLabel(occasion))
  const timezoneOptions = TIMEZONE_OPTIONS.map((timezone) => timezone.zh)
  const selectedTimezoneLabel =
    timezoneOptions[timezoneIndex] ||
    (() => {
      const rawValue = userProfile?.timezone || TIMEZONE_OPTIONS[timezoneIndex]?.value || 'UTC'
      const matched = findTimezoneOption(rawValue)
      if (matched) {
        return matched.zh
      }
      return rawValue
    })()

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.display_name)
      const savedLocation = toResolvedLocationDraft(userProfile)
      setLocationName(savedLocation.locationName)
      setLocationLat(savedLocation.locationLat)
      setLocationLon(savedLocation.locationLon)
      const tzIndex = TIMEZONE_OPTIONS.findIndex((timezone) => timezone.value === userProfile.timezone)
      if (tzIndex >= 0) {
        setTimezoneIndex(tzIndex)
      }
    }
  }, [userProfile])

  useEffect(() => {
    if (prefs) {
      const oi = OCCASION_VALUES.findIndex((value) => value === prefs.default_occasion)
      if (oi >= 0) setOccasionIndex(oi)
      const ti = TEMPERATURE_UNIT_VALUES.findIndex((value) => value === prefs.temperature_unit)
      if (ti >= 0) setTempUnitIndex(ti)
    }
  }, [prefs])

  if (!canRender) return null

  const notificationCount = notificationSettings?.length ?? 0
  const enabledNotificationCount = notificationSettings?.filter((setting) => setting.enabled).length ?? 0
  const selectedTimezoneValue = TIMEZONE_OPTIONS[timezoneIndex]?.value || userProfile?.timezone || 'UTC'
  const profileSaveDisabled = updateProfile.isPending
  const chooseLocationDisabled = updateProfile.isPending
  const prefsSaveDisabled = updatePrefs.isPending

  const handleSaveProfile = async () => {
    if (profileSaveDisabled) return

    try {
      const resolvedLocation = await resolveLocationDraftForSave(
        {
          locationName,
          locationLat,
          locationLon,
        },
        geocodeWeatherLocation
      )
      setLocationName(resolvedLocation.locationName)
      setLocationLat(resolvedLocation.locationLat)
      setLocationLon(resolvedLocation.locationLon)
      await updateProfile.mutateAsync(
        buildUserProfileUpdate({
          displayName,
          timezone: selectedTimezoneValue,
          location: resolvedLocation,
        })
      )
      void Taro.showToast({ title: t('settings_toast_profile_updated'), icon: 'success' })
    } catch (error) {
      const message =
        error instanceof WechatLocationError
          ? t('settings_location_select_required')
          : error instanceof Error
            ? error.message
            : t('settings_toast_update_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleChooseLocation = async () => {
    if (chooseLocationDisabled) return

    try {
      const result = await chooseWechatLocation()
      const selectedLocation = {
        locationName: result.name || result.address || '',
        locationLat: result.latitude,
        locationLon: result.longitude,
      }
      await updateProfile.mutateAsync(
        buildUserProfileUpdate({
          displayName: displayName || userProfile?.display_name || '',
          timezone: selectedTimezoneValue,
          location: selectedLocation,
        })
      )
      setLocationName(selectedLocation.locationName)
      setLocationLat(selectedLocation.locationLat)
      setLocationLon(selectedLocation.locationLon)
      void Taro.showToast({ title: t('settings_location_saved'), icon: 'success' })
    } catch (error) {
      const message =
        error instanceof WechatLocationError
          ? error.code === 'permission-denied'
            ? t('settings_location_error_permission')
            : error.code === 'canceled'
              ? t('settings_location_error_canceled')
              : t('settings_location_error_unavailable')
          : error instanceof Error
            ? error.message
            : t('settings_toast_update_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleSavePrefs = async () => {
    if (prefsSaveDisabled) return

    try {
      await updatePrefs.mutateAsync({
        default_occasion: OCCASION_VALUES[occasionIndex],
        temperature_unit: TEMPERATURE_UNIT_VALUES[tempUnitIndex],
      })
      void Taro.showToast({ title: t('settings_toast_preferences_updated'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('settings_toast_update_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleLogout = () => {
    clearStoredAccessToken()
    setAccessToken(null)
    void Taro.redirectTo({ url: '/pages/login/index' })
  }

  return (
    <PageShell title={t('page_settings_title')} subtitle={t('page_settings_subtitle')} navKey='settings' useBuiltInTabBar>
      <SectionCard compact title={t('settings_account_summary_title')}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <FlatMetricGrid
            metrics={[
              {
                label: t('settings_stat_channels_label'),
                value: String(notificationCount),
                hint: notificationCount
                  ? tf('settings_stat_channels_hint_enabled', { enabled: enabledNotificationCount })
                  : t('settings_stat_channels_hint_empty'),
                onClick: () => navigateToPage('/pages/notifications/index'),
                ariaLabel: t('settings_stat_channels_label'),
              },
              {
                label: t('settings_stat_family_label'),
                value: userProfile?.family_id ? t('settings_family_joined') : t('settings_family_not_joined'),
                hint: userProfile?.role
                  ? tf('settings_family_role_hint', { role: formatRoleLabel(userProfile.role) })
                  : t('settings_family_solo_hint'),
                onClick: () => navigateToPage('/pages/family/index'),
                ariaLabel: t('settings_stat_family_label'),
              },
            ]}
          />
          <View style={actionWrapRowStyle}>
            <UIBadge
              label={
                userProfile?.onboarding_completed
                  ? t('settings_badge_onboarding_done')
                  : t('settings_badge_onboarding_pending')
              }
              tone={userProfile?.onboarding_completed ? 'success' : 'warning'}
            />
            <UIBadge label={selectedTimezoneLabel} />
            <UIBadge label={tempUnitLabels[TEMPERATURE_UNIT_VALUES[tempUnitIndex]]} />
          </View>
          {userProfile?.email ? (
            <FlatList>
              <FlatListRow>
                <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted }}>{t('settings_email_label')}</Text>
                <Text style={{ display: 'block', marginTop: '4px', fontSize: '14px', color: colors.text }}>
                  {userProfile.email}
                </Text>
              </FlatListRow>
            </FlatList>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard compact title={t('settings_profile_title')}>
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
              onInput={(e) => {
                const nextLocation = applyManualLocationName(
                  {
                    locationName,
                    locationLat,
                    locationLon,
                  },
                  e.detail.value
                )
                setLocationName(nextLocation.locationName)
                setLocationLat(nextLocation.locationLat)
                setLocationLon(nextLocation.locationLon)
              }}
              style={inputStyle}
            />
          </View>
          <View ariaRole='button' ariaLabel={t('settings_choose_location')} onClick={getEnabledActionHandler(chooseLocationDisabled, handleChooseLocation)} style={getActionButtonStyle({ disabled: chooseLocationDisabled })}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('settings_choose_location')}</Text>
          </View>
          {hasResolvedLocation({ locationName, locationLat, locationLon }) ? (
            <Text style={{ fontSize: '12px', color: colors.textSoft }}>
              {tf('settings_location_coordinates_saved', {
                lat: locationLat!.toFixed(4),
                lon: locationLon!.toFixed(4),
              })}
            </Text>
          ) : locationName.trim() ? (
            <Text style={{ fontSize: '12px', color: colors.warning }}>
              {t('settings_location_coordinates_missing')}
            </Text>
          ) : null}
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>{t('settings_timezone_label')}</Text>
            <Picker mode='selector' range={timezoneOptions} value={timezoneIndex} onChange={(e) => setTimezoneIndex(Number(e.detail.value))}>
              <View style={inputStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{selectedTimezoneLabel}</Text>
              </View>
            </Picker>
          </View>
          <View ariaRole='button' ariaLabel={t('settings_save_profile')} onClick={getEnabledActionHandler(profileSaveDisabled, handleSaveProfile)} style={getActionButtonStyle({ variant: 'primary', disabled: profileSaveDisabled })}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
              {updateProfile.isPending ? t('settings_saving') : t('settings_save_profile')}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard compact title={t('settings_preferences_title')}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>{t('settings_default_occasion_label')}</Text>
            <CompactOptionGroup
              activeIndex={occasionIndex}
              options={occasionOptions}
              onChange={setOccasionIndex}
            />
          </View>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>{t('settings_temperature_unit_label')}</Text>
            <CompactOptionGroup
              activeIndex={tempUnitIndex}
              options={TEMPERATURE_UNIT_VALUES.map((unit) => tempUnitLabels[unit])}
              onChange={setTempUnitIndex}
            />
          </View>
          <View ariaRole='button' ariaLabel={t('settings_save_preferences')} onClick={getEnabledActionHandler(prefsSaveDisabled, handleSavePrefs)} style={getActionButtonStyle({ variant: 'primary', disabled: prefsSaveDisabled })}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
              {updatePrefs.isPending ? t('settings_saving') : t('settings_save_preferences')}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard compact title={t('settings_shortcuts_title')}>
        <View style={actionWrapRowStyle}>
          <View ariaRole='button' ariaLabel={t('settings_shortcut_notifications')} onClick={() => navigateToPage('/pages/notifications/index')} style={getActionButtonStyle({ compact: true, flex: 1, minWidth: '120px' })}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('settings_shortcut_notifications')}</Text>
          </View>
          <View ariaRole='button' ariaLabel={t('settings_shortcut_family')} onClick={() => navigateToPage('/pages/family/index')} style={getActionButtonStyle({ compact: true, flex: 1, minWidth: '120px' })}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('settings_shortcut_family')}</Text>
          </View>
          <View ariaRole='button' ariaLabel={t('settings_shortcut_learning')} onClick={() => navigateToPage('/pages/learning/index')} style={getActionButtonStyle({ compact: true, flex: 1, minWidth: '120px' })}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('settings_shortcut_learning')}</Text>
          </View>
          <View ariaRole='button' ariaLabel={t('settings_shortcut_analytics')} onClick={() => navigateToPage('/pages/analytics/index')} style={getActionButtonStyle({ compact: true, flex: 1, minWidth: '120px' })}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('settings_shortcut_analytics')}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard compact title={t('settings_account_title')}>
        {confirmLogout ? (
          <View style={actionWrapRowStyle}>
            <View
              ariaRole='button'
              ariaLabel={t('settings_logout_keep')}
              onClick={() => setConfirmLogout(false)}
              style={getActionButtonStyle({ compact: true, flex: 1, minWidth: '110px' })}
            >
              <Text style={{ fontSize: '14px', color: colors.text }}>{t('settings_logout_keep')}</Text>
            </View>
            <View
              ariaRole='button'
              ariaLabel={t('settings_logout_confirm')}
              onClick={handleLogout}
              style={getActionButtonStyle({ compact: true, flex: 1, minWidth: '110px', tone: 'danger' })}
            >
              <Text style={{ fontSize: '14px', color: colors.danger }}>{t('settings_logout_confirm')}</Text>
            </View>
          </View>
        ) : (
          <View
            ariaRole='button'
            ariaLabel={t('settings_logout')}
            onClick={() => setConfirmLogout(true)}
            style={getActionButtonStyle({ compact: true, tone: 'danger' })}
          >
            <Text style={{ fontSize: '14px', color: colors.danger }}>{t('settings_logout')}</Text>
          </View>
        )}
      </SectionCard>
    </PageShell>
  )
}
