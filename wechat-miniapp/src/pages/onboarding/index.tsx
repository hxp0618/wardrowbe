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
import { useI18n } from '../../lib/i18n'
import { ITEM_TYPE_VALUES, WARDROBE_COLOR_OPTIONS, isLightWardrobeColor } from '../../lib/options'
import {
  applyManualLocationName,
  buildUserProfileUpdate,
  resolveLocationDraftForSave,
  toResolvedLocationDraft,
} from '../../lib/location-form'
import { isChooseImageCanceled } from '../../lib/choose-image'
import { toastError, toastErrorFromException, toastSuccess } from '../../lib/toast'
import { getEditableWechatDisplayName } from '../../lib/wechat-user'
import { chooseWechatLocation, WechatLocationError } from '../../lib/wechat-location'
import { geocodeWeatherLocation } from '../../services/outfits'

const DASHBOARD_PAGE_URL = '/pages/dashboard/index'
const TOTAL_STEPS = 5

const STYLE_KEYS = ['casual', 'formal', 'sporty', 'minimalist', 'bold'] as const
const STYLE_LABEL_KEYS: Record<(typeof STYLE_KEYS)[number],
  'onboarding_style_casual' | 'onboarding_style_formal' | 'onboarding_style_sporty' | 'onboarding_style_minimalist' | 'onboarding_style_bold'> = {
  casual: 'onboarding_style_casual',
  formal: 'onboarding_style_formal',
  sporty: 'onboarding_style_sporty',
  minimalist: 'onboarding_style_minimalist',
  bold: 'onboarding_style_bold',
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
  backLabel: string
  skipLabel: string
  primaryLabel: string
  loadingLabel: string
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
        <View ariaRole='button' ariaLabel={props.backLabel} onClick={props.onBack} style={getActionButtonStyle({ flex: 1 })}>
          <Text style={{ fontSize: '14px', color: colors.text }}>{props.backLabel}</Text>
        </View>
      ) : null}
      {props.showSkip ? (
        <View ariaRole='button' ariaLabel={props.skipLabel} onClick={props.onSkip} style={getActionButtonStyle({ flex: 1 })}>
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{props.skipLabel}</Text>
        </View>
      ) : null}
      <View
        ariaRole='button'
        ariaLabel={props.primaryLabel}
        onClick={getEnabledActionHandler(primaryDisabled, props.onPrimary)}
        style={getActionButtonStyle({ variant: 'primary', flex: 1, disabled: primaryDisabled, disabledOpacity: 0.65 })}
      >
        <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
          {props.loading ? props.loadingLabel : props.primaryLabel}
        </Text>
      </View>
    </View>
  )
}

function ColorPicker(props: {
  selected: string[]
  onChange: (colors: string[]) => void
  tone: 'favorite' | 'avoid'
  ariaLabelTone: string
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
            ariaLabel={`${props.ariaLabelTone}：${formatColorLabel(color.value)}`}
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
  const { t, tf } = useI18n()
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
      toastSuccess(t('onboarding_toast_location_acquired'))
    } catch (error) {
      const message =
        error instanceof WechatLocationError
          ? error.code === 'permission-denied'
            ? t('onboarding_toast_location_permission_denied')
            : error.code === 'canceled'
              ? t('onboarding_toast_location_canceled')
              : t('onboarding_toast_location_unavailable')
          : error instanceof Error
            ? error.message
            : t('onboarding_toast_location_failed')
      toastError(message)
    }
  }

  const handleStartOnboarding = async () => {
    const normalizedDisplayName = displayName.trim()

    if (!normalizedDisplayName) {
      toastError(t('onboarding_toast_nickname_required'))
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
      toastErrorFromException(error, t('onboarding_toast_save_nickname_failed'))
    }
  }

  const handleFamilyContinue = async () => {
    try {
      if (familyMode === 'create') {
        if (!familyName.trim()) return
        await createFamily.mutateAsync(familyName.trim())
        toastSuccess(t('onboarding_toast_family_created'))
      }
      if (familyMode === 'join') {
        if (!inviteCode.trim()) return
        await joinFamily.mutateAsync(inviteCode.trim().toUpperCase())
        toastSuccess(t('onboarding_toast_family_joined'))
      }
      setStep(2)
    } catch (error) {
      toastErrorFromException(error, t('onboarding_toast_action_failed'))
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
      toastSuccess(t('onboarding_toast_location_saved'))
      setStep(3)
    } catch (error) {
      toastErrorFromException(error, t('onboarding_toast_save_failed'))
    }
  }

  const handleSavePreferences = async () => {
    try {
      await updatePreferences.mutateAsync({
        color_favorites: favoriteColors,
        color_avoid: avoidColors,
        style_profile: styleProfile,
      })
      toastSuccess(t('onboarding_toast_preferences_saved'))
      setStep(4)
    } catch (error) {
      toastErrorFromException(error, t('onboarding_toast_save_failed'))
    }
  }

  const handleChooseImage = async () => {
    try {
      const result = await Taro.chooseImage({ count: 5, sizeType: ['compressed'] })
      if (!result.tempFilePaths.length) return
      setUploadPaths(result.tempFilePaths)
    } catch (error) {
      if (isChooseImageCanceled(error)) return
      toastErrorFromException(error, t('onboarding_toast_choose_image_failed'))
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
      toastSuccess(t('onboarding_toast_first_item_added'))
      setStep(5)
    } catch (error) {
      toastErrorFromException(error, t('onboarding_toast_upload_failed'))
    }
  }

  const handleComplete = async () => {
    try {
      await complete.mutateAsync()
      toastSuccess(t('onboarding_toast_completed'))
      await navigateToDashboard()
    } catch (error) {
      toastErrorFromException(error, t('onboarding_toast_complete_failed'))
    }
  }

  const title = step < TOTAL_STEPS ? t('onboarding_title_intro') : t('onboarding_title_done')
  const subtitle =
    step < TOTAL_STEPS
      ? t('onboarding_subtitle_intro')
      : t('onboarding_subtitle_done')
  const stepActionDefaults = {
    backLabel: t('onboarding_back'),
    skipLabel: t('onboarding_skip'),
    loadingLabel: t('onboarding_processing'),
  }

  return (
    <PageShell header={null} title={title} subtitle={subtitle}>
      {step < TOTAL_STEPS ? <StepIndicator currentStep={step} /> : null}

      {step === 0 ? (
        <>
          <SectionCard compact title={t('onboarding_section_intro')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text style={{ fontSize: '18px', fontWeight: 600, color: colors.text }}>
                {displayName
                  ? tf('onboarding_welcome_named', { name: displayName.split(' ')[0] })
                  : t('onboarding_welcome_unnamed')}
              </Text>
              <View style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                  {t('onboarding_intro_description')}
                </Text>
                <Input
                  value={displayName}
                  placeholder={t('onboarding_nickname_placeholder')}
                  onInput={(event) => setDisplayName(event.detail.value)}
                  maxlength={100}
                  style={inputStyle}
                />
              </View>
            </View>
          </SectionCard>

          <StepActions
            {...stepActionDefaults}
            primaryLabel={t('onboarding_save_nickname_continue')}
            onPrimary={handleStartOnboarding}
            disabled={!displayName.trim()}
            loading={updateUserProfile.isPending}
          />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <SectionCard compact title={t('onboarding_section_family')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                {t('onboarding_family_description')}
              </Text>
              <CompactOptionGroup
                activeIndex={familyModeIndex}
                options={[t('onboarding_family_mode_create'), t('onboarding_family_mode_join')]}
                onChange={(nextIndex) => setFamilyMode(nextIndex === 0 ? 'create' : 'join')}
              />
              {familyMode === 'create' ? (
                <Input value={familyName} placeholder={t('onboarding_family_name_placeholder')} onInput={(event) => setFamilyName(event.detail.value)} style={inputStyle} />
              ) : null}
              {familyMode === 'join' ? (
                <Input value={inviteCode} placeholder={t('onboarding_invite_code_placeholder')} onInput={(event) => setInviteCode(event.detail.value.toUpperCase())} style={inputStyle} />
              ) : null}
            </View>
          </SectionCard>

          <StepActions
            {...stepActionDefaults}
            showBack
            showSkip
            onBack={() => setStep(0)}
            onSkip={() => setStep(2)}
            onPrimary={handleFamilyContinue}
            primaryLabel={
              familyMode === 'join'
                ? t('onboarding_family_continue_join')
                : familyMode === 'create'
                  ? t('onboarding_family_continue_create')
                  : t('onboarding_family_continue')
            }
            disabled={(familyMode === 'create' && !familyName.trim()) || (familyMode === 'join' && !inviteCode.trim())}
            loading={createFamily.isPending || joinFamily.isPending}
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <SectionCard compact title={t('onboarding_section_location')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                {t('onboarding_location_description')}
              </Text>
              <View ariaRole='button' ariaLabel={t('onboarding_location_choose')} onClick={handleDetectLocation} style={getActionButtonStyle()}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{t('onboarding_location_choose')}</Text>
              </View>
              <Input
                value={locationName}
                placeholder={t('onboarding_location_placeholder')}
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
                  {tf('onboarding_location_coordinates', { lat: locationLat.toFixed(4), lon: locationLon.toFixed(4) })}
                </Text>
              ) : locationName.trim() ? (
                <Text style={{ fontSize: '12px', color: colors.warning }}>
                  {t('onboarding_location_warning')}
                </Text>
              ) : null}
            </View>
          </SectionCard>

          <StepActions
            {...stepActionDefaults}
            showBack
            showSkip
            onBack={() => setStep(1)}
            onSkip={() => setStep(3)}
            onPrimary={handleSaveLocation}
            primaryLabel={t('onboarding_save_continue')}
            disabled={!locationName.trim()}
            loading={updateUserProfile.isPending}
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <SectionCard compact title={t('onboarding_section_preferences')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Text style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>{t('onboarding_color_favorites')}</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted }}>{t('onboarding_color_favorites_hint')}</Text>
                <ColorPicker
                  selected={favoriteColors}
                  onChange={(next) => {
                    setFavoriteColors(next)
                    setAvoidColors((prev) => prev.filter((item) => !next.includes(item)))
                  }}
                  tone='favorite'
                  ariaLabelTone={t('onboarding_pick_favorite_color')}
                />
                {favoriteColors.length ? (
                  <Text style={{ fontSize: '12px', color: colors.textSoft }}>
                    {tf('onboarding_color_selected', { labels: favoriteColors.map((value) => formatColorLabel(value)).join('、') })}
                  </Text>
                ) : null}
              </View>

              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '14px', borderTop: `1px solid ${colors.border}` }}>
                <Text style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>{t('onboarding_color_avoid')}</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted }}>{t('onboarding_color_avoid_hint')}</Text>
                <ColorPicker
                  selected={avoidColors}
                  onChange={(next) => {
                    setAvoidColors(next)
                    setFavoriteColors((prev) => prev.filter((item) => !next.includes(item)))
                  }}
                  tone='avoid'
                  ariaLabelTone={t('onboarding_pick_avoid_color')}
                />
                {avoidColors.length ? (
                  <Text style={{ fontSize: '12px', color: colors.textSoft }}>
                    {tf('onboarding_color_selected', { labels: avoidColors.map((value) => formatColorLabel(value)).join('、') })}
                  </Text>
                ) : null}
              </View>

              <View style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '14px', borderTop: `1px solid ${colors.border}` }}>
                <Text style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>{t('onboarding_style_profile')}</Text>
                {STYLE_KEYS.map((key) => (
                  <View key={key}>
                    <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text style={{ fontSize: '14px', color: colors.text }}>{t(STYLE_LABEL_KEYS[key])}</Text>
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
            {...stepActionDefaults}
            showBack
            showSkip
            onBack={() => setStep(2)}
            onSkip={() => setStep(4)}
            onPrimary={handleSavePreferences}
            primaryLabel={t('onboarding_save_continue')}
            loading={updatePreferences.isPending}
          />
        </>
      ) : null}

      {step === 4 ? (
        <>
          <SectionCard compact title={t('onboarding_section_first_item')}>
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
                  <Text style={{ fontSize: '15px', color: colors.text }}>{t('onboarding_pick_image_title')}</Text>
                  <Text style={{ fontSize: '12px', color: colors.textMuted }}>{t('onboarding_pick_image_hint')}</Text>
                </View>
              )}

              <View ariaRole='button' ariaLabel={uploadPaths.length ? t('onboarding_reselect_image') : t('onboarding_choose_image')} onClick={handleChooseImage} style={getActionButtonStyle()}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{uploadPaths.length ? t('onboarding_reselect_image') : t('onboarding_choose_image')}</Text>
              </View>

              {uploadPaths.length ? (
                <>
                  <CompactOptionGroup
                    activeIndex={uploadTypeIndex}
                    options={ITEM_TYPE_VALUES.map((type) => formatItemTypeLabel(type))}
                    onChange={setUploadTypeIndex}
                  />
                  <Text style={{ fontSize: '12px', color: colors.textSoft }}>{tf('onboarding_image_count', { count: uploadPaths.length })}</Text>
                </>
              ) : null}
            </View>
          </SectionCard>

          <StepActions
            {...stepActionDefaults}
            showBack
            showSkip
            onBack={() => setStep(3)}
            onSkip={() => setStep(5)}
            onPrimary={handleUploadFirstItem}
            primaryLabel={uploadPaths.length ? t('onboarding_first_item_continue') : t('onboarding_family_continue')}
            loading={createItem.isPending}
          />
        </>
      ) : null}

      {step === 5 ? (
        <>
          <SectionCard compact title={t('onboarding_section_done')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <View style={{ width: '72px', height: '72px', borderRadius: '999px', backgroundColor: 'rgba(52, 211, 153, 0.14)', border: '1px solid rgba(52, 211, 153, 0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '28px', color: colors.success, fontWeight: 700 }}>✓</Text>
              </View>
              <Text style={{ fontSize: '18px', fontWeight: 600, color: colors.text }}>{t('onboarding_done_heading')}</Text>
              <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                {t('onboarding_done_description')}
              </Text>
            </View>
          </SectionCard>

          <StepActions
            {...stepActionDefaults}
            showBack
            onBack={() => setStep(4)}
            onPrimary={handleComplete}
            primaryLabel={t('onboarding_enter_dashboard')}
            loading={complete.isPending}
          />
        </>
      ) : null}
    </PageShell>
  )
}
