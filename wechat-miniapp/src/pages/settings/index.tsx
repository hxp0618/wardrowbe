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
import { useAuthStore } from '../../stores/auth'
import { colors, inputStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'

const OCCASIONS = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const TEMPERATURE_UNITS = ['celsius', 'fahrenheit']
const TIMEZONES = ['Asia/Shanghai', 'Asia/Tokyo', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'UTC']
const TEMP_UNIT_LABELS: Record<string, string> = {
  celsius: '摄氏',
  fahrenheit: '华氏',
}

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
      void Taro.showToast({ title: '资料已更新', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleSavePrefs = async () => {
    try {
      await updatePrefs.mutateAsync({
        default_occasion: OCCASIONS[occasionIndex],
        temperature_unit: TEMPERATURE_UNITS[tempUnitIndex] as 'celsius' | 'fahrenheit',
      })
      void Taro.showToast({ title: '偏好已更新', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleLogout = () => {
    Taro.removeStorageSync('accessToken')
    setAccessToken(null)
    void Taro.redirectTo({ url: '/pages/login/index' })
  }

  return (
    <PageShell title='设置' subtitle='管理偏好、位置与通知' navKey='settings' useBuiltInTabBar>
      <View style={{ display: 'flex', gap: '12px' }}>
        <StatCard
          label='通知渠道'
          value={String(notificationCount)}
          hint={notificationCount ? `已启用 ${enabledNotificationCount} 个` : '可在下方快捷进入通知管理'}
        />
        <StatCard
          label='家庭状态'
          value={userProfile?.family_id ? '已加入' : '未加入'}
          hint={userProfile?.role ? `角色：${formatRoleLabel(userProfile.role)}` : '单人模式'}
        />
      </View>

      <SectionCard title='账号摘要'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <UIBadge label={userProfile?.onboarding_completed ? '已完成引导' : '待完成引导'} tone={userProfile?.onboarding_completed ? 'success' : 'warning'} />
            <UIBadge label={TIMEZONES[timezoneIndex] || userProfile?.timezone || 'UTC'} />
            <UIBadge label={TEMPERATURE_UNITS[tempUnitIndex] === 'fahrenheit' ? '华氏温度' : '摄氏温度'} />
          </View>
          {userProfile?.email ? (
            <View style={{ padding: '10px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
              <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted }}>邮箱</Text>
              <Text style={{ display: 'block', marginTop: '4px', fontSize: '14px', color: colors.text }}>
                {userProfile.email}
              </Text>
            </View>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard title='个人资料'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>显示名称</Text>
            <Input value={displayName} onInput={(e) => setDisplayName(e.detail.value)} style={inputStyle} />
          </View>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>位置名称</Text>
            <Input value={locationName} placeholder='例如：北京' onInput={(e) => setLocationName(e.detail.value)} style={inputStyle} />
          </View>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>时区</Text>
            <Picker mode='selector' range={TIMEZONES} value={timezoneIndex} onChange={(e) => setTimezoneIndex(Number(e.detail.value))}>
              <View style={inputStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{TIMEZONES[timezoneIndex]}</Text>
              </View>
            </Picker>
          </View>
          <View onClick={handleSaveProfile} style={{ ...primaryButtonStyle, opacity: updateProfile.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
              {updateProfile.isPending ? '保存中...' : '保存资料'}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title='偏好设置'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>默认场景</Text>
            <Picker mode='selector' range={OCCASIONS} value={occasionIndex} onChange={(e) => setOccasionIndex(Number(e.detail.value))}>
              <View style={inputStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{formatOccasionLabel(OCCASIONS[occasionIndex])}</Text>
              </View>
            </Picker>
          </View>
          <View>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>温度单位</Text>
            <Picker mode='selector' range={TEMPERATURE_UNITS} value={tempUnitIndex} onChange={(e) => setTempUnitIndex(Number(e.detail.value))}>
              <View style={inputStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{TEMP_UNIT_LABELS[TEMPERATURE_UNITS[tempUnitIndex]]}</Text>
              </View>
            </Picker>
          </View>
          <View onClick={handleSavePrefs} style={{ ...primaryButtonStyle, opacity: updatePrefs.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
              {updatePrefs.isPending ? '保存中...' : '保存偏好'}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title='快捷入口'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <View onClick={() => Taro.navigateTo({ url: '/pages/notifications/index' })} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>通知管理</Text>
          </View>
          <View onClick={() => Taro.navigateTo({ url: '/pages/family/index' })} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>家庭管理</Text>
          </View>
          <View onClick={() => Taro.navigateTo({ url: '/pages/learning/index' })} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>学习画像</Text>
          </View>
          <View onClick={() => Taro.navigateTo({ url: '/pages/analytics/index' })} style={secondaryButtonStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>数据分析</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title='账号'>
        <View onClick={handleLogout} style={{ ...secondaryButtonStyle, backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)' }}>
          <Text style={{ fontSize: '14px', color: colors.danger }}>退出登录</Text>
        </View>
      </SectionCard>
    </PageShell>
  )
}
