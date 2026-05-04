import { useEffect, useState } from 'react'
import { Input, Slider, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { actionRowStyle, getActionButtonStyle, getEnabledActionHandler } from '../../components/action-style'
import { CompactOptionGroup } from '../../components/compact-option-group'
import { PageShell } from '../../components/page-shell'
import { PreviewableImage } from '../../components/previewable-image'
import { SectionCard } from '../../components/section-card'
import { colors, inputStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useCreateFamily, useJoinFamily } from '../../hooks/use-family'
import { useCreateItemWithImages } from '../../hooks/use-items'
import { usePreferences, useUpdatePreferences } from '../../hooks/use-preferences'
import { useCompleteOnboarding, useUpdateUserProfile, useUserProfile } from '../../hooks/use-user'
import { formatColorLabel, formatItemTypeLabel } from '../../lib/display'
import { ITEM_TYPE_VALUES, WARDROBE_COLOR_OPTIONS, isLightWardrobeColor } from '../../lib/options'
import {
  applyManualLocationName,
  buildUserProfileUpdate,
  resolveLocationDraftForSave,
  toResolvedLocationDraft,
} from '../../lib/location-form'
import { isChooseImageCanceled } from '../../lib/choose-image'
import { getEditableWechatDisplayName } from '../../lib/wechat-user'
import { chooseWechatLocation, WechatLocationError } from '../../lib/wechat-location'
import { geocodeWeatherLocation } from '../../services/outfits'

const DASHBOARD_PAGE_URL = '/pages/dashboard/index'
const TOTAL_STEPS = 5

const STYLE_KEYS = ['casual', 'formal', 'sporty', 'minimalist', 'bold'] as const
const STYLE_LABELS: Record<(typeof STYLE_KEYS)[number], string> = {
  casual: '休闲',
  formal: '正式',
  sporty: '运动',
  minimalist: '极简',
  bold: '大胆',
}

async function navigateToDashboard() {
  await Taro.switchTab({ url: DASHBOARD_PAGE_URL })
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
        const isComplete = index < currentStep
        const isCurrent = index === currentStep

        return (
          <View key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <View
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isComplete || isCurrent ? colors.accent : colors.surfaceMuted,
                border: isCurrent ? `2px solid ${colors.borderStrong}` : `1px solid ${colors.border}`,
              }}
            >
              <Text style={{ fontSize: '13px', color: isComplete || isCurrent ? colors.accentText : colors.textMuted, fontWeight: 600 }}>
                {isComplete ? '✓' : index + 1}
              </Text>
            </View>
            {index < TOTAL_STEPS - 1 ? (
              <View
                style={{
                  width: '18px',
                  height: '3px',
                  borderRadius: '999px',
                  backgroundColor: index < currentStep ? colors.accent : colors.surfaceMuted,
                }}
              />
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

function StepActions(props: {
  showBack?: boolean
  showSkip?: boolean
  backLabel?: string
  skipLabel?: string
  primaryLabel: string
  onBack?: () => void
  onSkip?: () => void
  onPrimary: () => void
  disabled?: boolean
  loading?: boolean
}) {
  const primaryDisabled = Boolean(props.disabled || props.loading)

  return (
    <View style={{ ...actionRowStyle, gap: '10px' }}>
      {props.showBack ? (
        <View ariaRole='button' ariaLabel={props.backLabel || '上一步'} onClick={props.onBack} style={getActionButtonStyle({ flex: 1 })}>
          <Text style={{ fontSize: '14px', color: colors.text }}>{props.backLabel || '上一步'}</Text>
        </View>
      ) : null}
      {props.showSkip ? (
        <View ariaRole='button' ariaLabel={props.skipLabel || '先跳过'} onClick={props.onSkip} style={getActionButtonStyle({ flex: 1 })}>
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{props.skipLabel || '先跳过'}</Text>
        </View>
      ) : null}
      <View
        ariaRole='button'
        ariaLabel={props.primaryLabel}
        onClick={getEnabledActionHandler(primaryDisabled, props.onPrimary)}
        style={getActionButtonStyle({ variant: 'primary', flex: 1, disabled: primaryDisabled, disabledOpacity: 0.65 })}
      >
        <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
          {props.loading ? '处理中...' : props.primaryLabel}
        </Text>
      </View>
    </View>
  )
}

function ColorPicker(props: {
  selected: string[]
  onChange: (colors: string[]) => void
  tone: 'favorite' | 'avoid'
}) {
  const borderColor = props.tone === 'favorite' ? colors.accent : colors.danger

  return (
    <View style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {WARDROBE_COLOR_OPTIONS.map((color) => {
        const active = props.selected.includes(color.value)

        return (
          <View
            key={color.value}
            ariaRole='button'
            ariaLabel={`${props.tone === 'favorite' ? '选择偏好颜色' : '标记避免颜色'}：${formatColorLabel(color.value)}`}
            onClick={() => {
              if (active) {
                props.onChange(props.selected.filter((item) => item !== color.value))
                return
              }
              props.onChange([...props.selected, color.value])
            }}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: color.hex,
              border: active ? `2px solid ${borderColor}` : `1px solid ${colors.border}`,
              boxSizing: 'border-box',
            }}
          >
            {active ? (
              <Text style={{ fontSize: '16px', color: isLightWardrobeColor(color.value) ? '#111827' : '#ffffff', fontWeight: 700 }}>
                {props.tone === 'favorite' ? '✓' : '×'}
              </Text>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

export default function OnboardingPage() {
  const canRender = useAuthGuard()
  const { data: userProfile } = useUserProfile()
  const { data: prefs } = usePreferences()
  const updateUserProfile = useUpdateUserProfile()
  const updatePreferences = useUpdatePreferences()
  const complete = useCompleteOnboarding()
  const createFamily = useCreateFamily()
  const joinFamily = useJoinFamily()
  const createItem = useCreateItemWithImages()

  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationLat, setLocationLat] = useState<number | undefined>(undefined)
  const [locationLon, setLocationLon] = useState<number | undefined>(undefined)
  const [familyMode, setFamilyMode] = useState<'create' | 'join' | null>(null)
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [favoriteColors, setFavoriteColors] = useState<string[]>([])
  const [avoidColors, setAvoidColors] = useState<string[]>([])
  const [styleProfile, setStyleProfile] = useState<Record<(typeof STYLE_KEYS)[number], number>>({
    casual: 50,
    formal: 50,
    sporty: 50,
    minimalist: 50,
    bold: 50,
  })
  const [uploadPaths, setUploadPaths] = useState<string[]>([])
  const [uploadTypeIndex, setUploadTypeIndex] = useState(0)
  const familyModeIndex = familyMode === 'create' ? 0 : familyMode === 'join' ? 1 : -1

  useEffect(() => {
    if (userProfile) {
      setDisplayName(getEditableWechatDisplayName(userProfile.display_name))
      const savedLocation = toResolvedLocationDraft(userProfile)
      setLocationName(savedLocation.locationName)
      setLocationLat(savedLocation.locationLat)
      setLocationLon(savedLocation.locationLon)
      if (userProfile.onboarding_completed) {
        void navigateToDashboard()
      }
    }
  }, [userProfile])

  useEffect(() => {
    if (prefs) {
      setFavoriteColors(prefs.color_favorites || [])
      setAvoidColors(prefs.color_avoid || [])
      setStyleProfile({
        casual: prefs.style_profile?.casual ?? 50,
        formal: prefs.style_profile?.formal ?? 50,
        sporty: prefs.style_profile?.sporty ?? 50,
        minimalist: prefs.style_profile?.minimalist ?? 50,
        bold: prefs.style_profile?.bold ?? 50,
      })
    }
  }, [prefs])

  if (!canRender) {
    return null
  }

  const handleDetectLocation = async () => {
    try {
      const result = await chooseWechatLocation()
      setLocationName(result.name || result.address || '')
      setLocationLat(result.latitude)
      setLocationLon(result.longitude)
      void Taro.showToast({ title: '已获取位置', icon: 'success' })
    } catch (error) {
      const message =
        error instanceof WechatLocationError
          ? error.code === 'permission-denied'
            ? '请先允许小程序访问位置信息'
            : error.code === 'canceled'
              ? '你已取消位置选择'
              : '微信定位接口暂时不可用'
          : error instanceof Error
            ? error.message
            : '定位失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleStartOnboarding = async () => {
    const normalizedDisplayName = displayName.trim()

    if (!normalizedDisplayName) {
      void Taro.showToast({ title: '请先设置你的昵称', icon: 'none' })
      return
    }

    try {
      if (normalizedDisplayName !== userProfile?.display_name?.trim()) {
        await updateUserProfile.mutateAsync(
          buildUserProfileUpdate({
            displayName: normalizedDisplayName,
            location: {
              locationName,
              locationLat,
              locationLon,
            },
          })
        )
      }
      setStep(1)
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存昵称失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleFamilyContinue = async () => {
    try {
      if (familyMode === 'create') {
        if (!familyName.trim()) return
        await createFamily.mutateAsync(familyName.trim())
        void Taro.showToast({ title: '家庭已创建', icon: 'success' })
      }
      if (familyMode === 'join') {
        if (!inviteCode.trim()) return
        await joinFamily.mutateAsync(inviteCode.trim().toUpperCase())
        void Taro.showToast({ title: '已加入家庭', icon: 'success' })
      }
      setStep(2)
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleSaveLocation = async () => {
    if (!locationName.trim()) return

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
      await updateUserProfile.mutateAsync(
        buildUserProfileUpdate({
          location: resolvedLocation,
        })
      )
      void Taro.showToast({ title: '位置已保存', icon: 'success' })
      setStep(3)
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleSavePreferences = async () => {
    try {
      await updatePreferences.mutateAsync({
        color_favorites: favoriteColors,
        color_avoid: avoidColors,
        style_profile: styleProfile,
      })
      void Taro.showToast({ title: '偏好已保存', icon: 'success' })
      setStep(4)
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleChooseImage = async () => {
    try {
      const result = await Taro.chooseImage({ count: 5, sizeType: ['compressed'] })
      if (!result.tempFilePaths.length) return
      setUploadPaths(result.tempFilePaths)
    } catch (error) {
      if (isChooseImageCanceled(error)) return
      const message = error instanceof Error ? error.message : '选图失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleUploadFirstItem = async () => {
    if (!uploadPaths.length) {
      setStep(5)
      return
    }

    try {
      await createItem.mutateAsync({
        filePaths: uploadPaths,
        fields: {
          type: ITEM_TYPE_VALUES[uploadTypeIndex],
        },
      })
      void Taro.showToast({ title: '首件单品已加入衣橱', icon: 'success' })
      setStep(5)
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleComplete = async () => {
    try {
      await complete.mutateAsync()
      void Taro.showToast({ title: '引导完成', icon: 'success' })
      await navigateToDashboard()
    } catch (error) {
      const message = error instanceof Error ? error.message : '完成失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const title = step < TOTAL_STEPS ? '欢迎使用 Wardrowbe' : '准备就绪'
  const subtitle =
    step < TOTAL_STEPS
      ? '用五步完成你的数字衣橱初始化'
      : '基础信息已经保存，可以进入首页开始使用'

  return (
    <PageShell header={null} title={title} subtitle={subtitle}>
      {step < TOTAL_STEPS ? <StepIndicator currentStep={step} /> : null}

      {step === 0 ? (
        <>
          <SectionCard compact title='开始之前'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text style={{ fontSize: '18px', fontWeight: 600, color: colors.text }}>
                {displayName ? `欢迎回来，${displayName.split(' ')[0]}` : '先设置一个你的昵称'}
              </Text>
              <View style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                  这是 Wardrowbe 内显示的昵称，不会直接读取你的微信真实昵称，后续也可以在设置里随时修改。
                </Text>
                <Input
                  value={displayName}
                  placeholder='例如：小雨 / Ada'
                  onInput={(event) => setDisplayName(event.detail.value)}
                  maxlength={100}
                  style={inputStyle}
                />
              </View>
            </View>
          </SectionCard>

          <StepActions
            primaryLabel='保存昵称并继续'
            onPrimary={handleStartOnboarding}
            disabled={!displayName.trim()}
            loading={updateUserProfile.isPending}
          />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <SectionCard compact title='家庭设置'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                这一步是可选的。你可以创建家庭空间，或者用邀请码加入已有家庭。
              </Text>
              <CompactOptionGroup
                activeIndex={familyModeIndex}
                options={['创建家庭', '加入家庭']}
                onChange={(nextIndex) => setFamilyMode(nextIndex === 0 ? 'create' : 'join')}
              />
              {familyMode === 'create' ? (
                <Input value={familyName} placeholder='输入家庭名称' onInput={(event) => setFamilyName(event.detail.value)} style={inputStyle} />
              ) : null}
              {familyMode === 'join' ? (
                <Input value={inviteCode} placeholder='输入邀请码' onInput={(event) => setInviteCode(event.detail.value.toUpperCase())} style={inputStyle} />
              ) : null}
            </View>
          </SectionCard>

          <StepActions
            showBack
            showSkip
            onBack={() => setStep(0)}
            onSkip={() => setStep(2)}
            onPrimary={handleFamilyContinue}
            primaryLabel={familyMode === 'join' ? '加入并继续' : familyMode === 'create' ? '创建并继续' : '继续'}
            disabled={(familyMode === 'create' && !familyName.trim()) || (familyMode === 'join' && !inviteCode.trim())}
            loading={createFamily.isPending || joinFamily.isPending}
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <SectionCard compact title='位置设置'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                推荐会结合天气。你可以直接选择位置，也可以手动填写城市名称。
              </Text>
              <View ariaRole='button' ariaLabel='选择当前位置' onClick={handleDetectLocation} style={getActionButtonStyle()}>
                <Text style={{ fontSize: '14px', color: colors.text }}>选择当前位置</Text>
              </View>
              <Input
                value={locationName}
                placeholder='例如：上海市'
                onInput={(event) => {
                  const nextLocation = applyManualLocationName(
                    {
                      locationName,
                      locationLat,
                      locationLon,
                    },
                    event.detail.value
                  )
                  setLocationName(nextLocation.locationName)
                  setLocationLat(nextLocation.locationLat)
                  setLocationLon(nextLocation.locationLon)
                }}
                style={inputStyle}
              />
              {locationLat != null && locationLon != null ? (
                <Text style={{ fontSize: '12px', color: colors.textSoft }}>
                  已记录坐标：{locationLat.toFixed(4)}, {locationLon.toFixed(4)}
                </Text>
              ) : locationName.trim() ? (
                <Text style={{ fontSize: '12px', color: colors.warning }}>
                  保存时会自动解析天气坐标；解析失败时可以改用当前位置。
                </Text>
              ) : null}
            </View>
          </SectionCard>

          <StepActions
            showBack
            showSkip
            onBack={() => setStep(1)}
            onSkip={() => setStep(3)}
            onPrimary={handleSaveLocation}
            primaryLabel='保存并继续'
            disabled={!locationName.trim()}
            loading={updateUserProfile.isPending}
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <SectionCard compact title='偏好设置'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Text style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>颜色偏好</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted }}>选择你偏爱的颜色</Text>
                <ColorPicker
                  selected={favoriteColors}
                  onChange={(next) => {
                    setFavoriteColors(next)
                    setAvoidColors((prev) => prev.filter((item) => !next.includes(item)))
                  }}
                  tone='favorite'
                />
                {favoriteColors.length ? (
                  <Text style={{ fontSize: '12px', color: colors.textSoft }}>
                    已选：{favoriteColors.map((value) => formatColorLabel(value)).join('、')}
                  </Text>
                ) : null}
              </View>

              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '14px', borderTop: `1px solid ${colors.border}` }}>
                <Text style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>避免颜色</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted }}>标记你不太想看到的颜色</Text>
                <ColorPicker
                  selected={avoidColors}
                  onChange={(next) => {
                    setAvoidColors(next)
                    setFavoriteColors((prev) => prev.filter((item) => !next.includes(item)))
                  }}
                  tone='avoid'
                />
                {avoidColors.length ? (
                  <Text style={{ fontSize: '12px', color: colors.textSoft }}>
                    已选：{avoidColors.map((value) => formatColorLabel(value)).join('、')}
                  </Text>
                ) : null}
              </View>

              <View style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '14px', borderTop: `1px solid ${colors.border}` }}>
                <Text style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>风格倾向</Text>
                {STYLE_KEYS.map((key) => (
                  <View key={key}>
                    <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: colors.text }}>{STYLE_LABELS[key]}</Text>
                      <Text style={{ fontSize: '12px', color: colors.textMuted }}>{styleProfile[key]}%</Text>
                    </View>
                    <Slider
                      min={0}
                      max={100}
                      step={10}
                      value={styleProfile[key]}
                      activeColor={colors.accent}
                      backgroundColor={colors.surfaceMuted}
                      onChange={(event) =>
                        setStyleProfile((prev) => ({
                          ...prev,
                          [key]: event.detail.value,
                        }))
                      }
                    />
                  </View>
                ))}
              </View>
            </View>
          </SectionCard>

          <StepActions
            showBack
            showSkip
            onBack={() => setStep(2)}
            onSkip={() => setStep(4)}
            onPrimary={handleSavePreferences}
            primaryLabel='保存并继续'
            loading={updatePreferences.isPending}
          />
        </>
      ) : null}

      {step === 4 ? (
        <>
          <SectionCard compact title='上传第一件单品'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {uploadPaths[0] ? (
                <PreviewableImage
                  src={uploadPaths[0]}
                  previewUrls={uploadPaths}
                  mode='aspectFill'
                  style={{ width: '100%', height: '220px', borderRadius: '8px', backgroundColor: colors.surfaceMuted }}
                />
              ) : (
                <View style={{ height: '160px', borderRadius: '8px', border: `1px dashed ${colors.borderStrong}`, backgroundColor: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                  <Text style={{ fontSize: '15px', color: colors.text }}>拍摄或选择衣物图片</Text>
                  <Text style={{ fontSize: '12px', color: colors.textMuted }}>支持 1-5 张图片，首张会作为主图</Text>
                </View>
              )}

              <View ariaRole='button' ariaLabel={uploadPaths.length ? '重新选择图片' : '选择图片'} onClick={handleChooseImage} style={getActionButtonStyle()}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{uploadPaths.length ? '重新选择图片' : '选择图片'}</Text>
              </View>

              {uploadPaths.length ? (
                <>
                  <CompactOptionGroup
                    activeIndex={uploadTypeIndex}
                    options={ITEM_TYPE_VALUES.map((type) => formatItemTypeLabel(type))}
                    onChange={setUploadTypeIndex}
                  />
                  <Text style={{ fontSize: '12px', color: colors.textSoft }}>已选择 {uploadPaths.length} 张图片</Text>
                </>
              ) : null}
            </View>
          </SectionCard>

          <StepActions
            showBack
            showSkip
            onBack={() => setStep(3)}
            onSkip={() => setStep(5)}
            onPrimary={handleUploadFirstItem}
            primaryLabel={uploadPaths.length ? '加入衣橱并继续' : '继续'}
            loading={createItem.isPending}
          />
        </>
      ) : null}

      {step === 5 ? (
        <>
          <SectionCard compact title='准备完成'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <View style={{ width: '72px', height: '72px', borderRadius: '999px', backgroundColor: 'rgba(52, 211, 153, 0.14)', border: '1px solid rgba(52, 211, 153, 0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '28px', color: colors.success, fontWeight: 700 }}>✓</Text>
              </View>
              <Text style={{ fontSize: '18px', fontWeight: 600, color: colors.text }}>基础设置已经完成</Text>
              <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                下一步会进入首页。之后你还可以继续补充衣橱、通知、家庭和更多偏好设置。
              </Text>
            </View>
          </SectionCard>

          <StepActions
            showBack
            onBack={() => setStep(4)}
            onPrimary={handleComplete}
            primaryLabel='进入首页'
            loading={complete.isPending}
          />
        </>
      ) : null}
    </PageShell>
  )
}
