import { Button, Input, Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'

import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useCreateFamily, useJoinFamily } from '../../hooks/use-family'
import { useUpdatePreferences } from '../../hooks/use-preferences'
import { useCompleteOnboarding, useUpdateUserProfile, useUserProfile } from '../../hooks/use-user'

const OCCASIONS = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const TEMPERATURE_UNITS = ['celsius', 'fahrenheit']

export default function OnboardingPage() {
  const canRender = useAuthGuard()
  const { data: userProfile } = useUserProfile()
  const updateUserProfile = useUpdateUserProfile()
  const updatePreferences = useUpdatePreferences()
  const complete = useCompleteOnboarding()
  const createFamily = useCreateFamily()
  const joinFamily = useJoinFamily()
  const [displayName, setDisplayName] = useState('')
  const [locationName, setLocationName] = useState('')
  const [occasionIndex, setOccasionIndex] = useState(0)
  const [tempUnitIndex, setTempUnitIndex] = useState(0)
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.display_name)
      setLocationName(userProfile.location_name || '')
      if (userProfile.onboarding_completed) {
        void Taro.redirectTo({ url: '/pages/dashboard/index' })
      }
    }
  }, [userProfile])

  if (!canRender) {
    return null
  }

  const handleComplete = async () => {
    try {
      await updateUserProfile.mutateAsync({
        display_name: displayName,
        location_name: locationName,
      })
      await updatePreferences.mutateAsync({
        default_occasion: OCCASIONS[occasionIndex],
        temperature_unit: TEMPERATURE_UNITS[tempUnitIndex] as 'celsius' | 'fahrenheit',
      })
      await complete.mutateAsync()
      void Taro.showToast({ title: '引导完成', icon: 'success' })
      await Taro.redirectTo({ url: '/pages/dashboard/index' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '完成失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell title='引导' subtitle='完善基础资料和推荐偏好后，就可以开始使用 Wardrowbe。'>
      <SectionCard title='基础资料'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input value={displayName} placeholder='显示名称' onInput={(event) => setDisplayName(event.detail.value)} style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', boxSizing: 'border-box' }} />
          <Input value={locationName} placeholder='位置名称' onInput={(event) => setLocationName(event.detail.value)} style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', boxSizing: 'border-box' }} />
          <Picker mode='selector' range={OCCASIONS} value={occasionIndex} onChange={(event) => setOccasionIndex(Number(event.detail.value))}>
            <View style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
              <Text style={{ fontSize: '22px', color: '#111827' }}>默认场景：{OCCASIONS[occasionIndex]}</Text>
            </View>
          </Picker>
          <Picker mode='selector' range={TEMPERATURE_UNITS} value={tempUnitIndex} onChange={(event) => setTempUnitIndex(Number(event.detail.value))}>
            <View style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
              <Text style={{ fontSize: '22px', color: '#111827' }}>温度单位：{TEMPERATURE_UNITS[tempUnitIndex]}</Text>
            </View>
          </Picker>
        </View>
      </SectionCard>

      <SectionCard title='家庭（可选）'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input value={familyName} placeholder='创建家庭名称' onInput={(event) => setFamilyName(event.detail.value)} style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', boxSizing: 'border-box' }} />
          <Button onClick={() => createFamily.mutate(familyName.trim())} loading={createFamily.isPending} disabled={!familyName.trim()}>
            创建家庭
          </Button>
          <Input value={inviteCode} placeholder='输入邀请码加入家庭' onInput={(event) => setInviteCode(event.detail.value.toUpperCase())} style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', boxSizing: 'border-box' }} />
          <Button onClick={() => joinFamily.mutate(inviteCode.trim().toUpperCase())} loading={joinFamily.isPending} disabled={!inviteCode.trim()}>
            加入家庭
          </Button>
        </View>
      </SectionCard>

      <SectionCard title='完成引导'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text style={{ fontSize: '22px', color: '#6B7280', lineHeight: 1.5 }}>
            完成后会进入首页。衣橱上传、推荐、历史、家庭和通知页面都可以继续补充配置。
          </Text>
          <Button onClick={handleComplete} loading={complete.isPending || updatePreferences.isPending || updateUserProfile.isPending}>
            开始使用
          </Button>
        </View>
      </SectionCard>
    </PageShell>
  )
}
