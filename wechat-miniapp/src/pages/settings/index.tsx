import { Button, Input, Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'

import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { usePreferences, useResetPreferences, useUpdatePreferences } from '../../hooks/use-preferences'
import { useUpdateUserProfile, useUserProfile } from '../../hooks/use-user'

const TEMPERATURE_UNITS = ['celsius', 'fahrenheit']
const OCCASIONS = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const TIMEZONES = ['UTC', 'Asia/Shanghai', 'Asia/Tokyo', 'Europe/London', 'America/New_York', 'America/Los_Angeles']

export default function SettingsPage() {
  const canRender = useAuthGuard()
  const { data: preferences } = usePreferences()
  const { data: userProfile } = useUserProfile()
  const updatePreferences = useUpdatePreferences()
  const resetPreferences = useResetPreferences()
  const updateUserProfile = useUpdateUserProfile()
  const [displayName, setDisplayName] = useState('')
  const [locationName, setLocationName] = useState('')
  const [timezoneIndex, setTimezoneIndex] = useState(0)
  const [tempUnitIndex, setTempUnitIndex] = useState(0)
  const [occasionIndex, setOccasionIndex] = useState(0)

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.display_name)
      setLocationName(userProfile.location_name || '')
      setTimezoneIndex(Math.max(TIMEZONES.indexOf(userProfile.timezone), 0))
    }
  }, [userProfile])

  useEffect(() => {
    if (preferences) {
      setTempUnitIndex(Math.max(TEMPERATURE_UNITS.indexOf(preferences.temperature_unit), 0))
      setOccasionIndex(Math.max(OCCASIONS.indexOf(preferences.default_occasion), 0))
    }
  }, [preferences])

  if (!canRender) {
    return null
  }

  const handleSave = async () => {
    try {
      await updateUserProfile.mutateAsync({
        display_name: displayName,
        location_name: locationName,
        timezone: TIMEZONES[timezoneIndex],
      })
      await updatePreferences.mutateAsync({
        temperature_unit: TEMPERATURE_UNITS[tempUnitIndex] as 'celsius' | 'fahrenheit',
        default_occasion: OCCASIONS[occasionIndex],
      })
      void Taro.showToast({ title: '设置已保存', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell title='设置' subtitle='统一管理个人资料、位置和推荐偏好。'>
      <SectionCard title='个人资料'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input value={displayName} placeholder='显示名称' onInput={(event) => setDisplayName(event.detail.value)} style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', boxSizing: 'border-box' }} />
          <Input value={locationName} placeholder='位置名称' onInput={(event) => setLocationName(event.detail.value)} style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', boxSizing: 'border-box' }} />
          <Picker mode='selector' range={TIMEZONES} value={timezoneIndex} onChange={(event) => setTimezoneIndex(Number(event.detail.value))}>
            <View style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
              <Text style={{ fontSize: '22px', color: '#111827' }}>{TIMEZONES[timezoneIndex]}</Text>
            </View>
          </Picker>
        </View>
      </SectionCard>

      <SectionCard title='推荐偏好'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Picker mode='selector' range={TEMPERATURE_UNITS} value={tempUnitIndex} onChange={(event) => setTempUnitIndex(Number(event.detail.value))}>
            <View style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
              <Text style={{ fontSize: '22px', color: '#111827' }}>{TEMPERATURE_UNITS[tempUnitIndex]}</Text>
            </View>
          </Picker>
          <Picker mode='selector' range={OCCASIONS} value={occasionIndex} onChange={(event) => setOccasionIndex(Number(event.detail.value))}>
            <View style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
              <Text style={{ fontSize: '22px', color: '#111827' }}>{OCCASIONS[occasionIndex]}</Text>
            </View>
          </Picker>
        </View>
      </SectionCard>

      <SectionCard title='操作'>
        <View style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button onClick={handleSave} loading={updatePreferences.isPending || updateUserProfile.isPending}>保存</Button>
          <Button onClick={() => resetPreferences.mutate()} loading={resetPreferences.isPending}>重置偏好</Button>
        </View>
      </SectionCard>
    </PageShell>
  )
}
