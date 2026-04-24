import { useEffect, useState } from 'react'

import { Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, inputStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { useI18n } from '../../lib/i18n'
import {
  getMiniappAuthAvailability,
  loginWithDev,
  loginWithWechatCode,
  type MiniappAuthAvailability,
} from '../../services/auth'
import { useAuthStore } from '../../stores/auth'

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'
const DASHBOARD_PAGE_URL = '/pages/dashboard/index'
const ONBOARDING_PAGE_URL = '/pages/onboarding/index'

async function navigateAfterLogin(options: {
  onboardingCompleted?: boolean
  inviteToken?: string
}) {
  if (options.inviteToken) {
    await Taro.redirectTo({
      url: `/pages/invite/index?token=${encodeURIComponent(options.inviteToken)}`,
    })
    return
  }

  if (options.onboardingCompleted) {
    await Taro.switchTab({ url: DASHBOARD_PAGE_URL })
    return
  }

  await Taro.redirectTo({ url: ONBOARDING_PAGE_URL })
}

export default function LoginPage() {
  const router = Taro.getCurrentInstance().router
  const inviteToken = router?.params?.inviteToken
  const { t } = useI18n()
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const setHydrated = useAuthStore((state) => state.setHydrated)
  const [email, setEmail] = useState('dev@wardrobe.local')
  const [displayName, setDisplayName] = useState('Dev User')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authAvailability, setAuthAvailability] = useState<MiniappAuthAvailability | null>(null)

  useEffect(() => {
    let active = true

    void getMiniappAuthAvailability()
      .then((nextAvailability) => {
        if (active) {
          setAuthAvailability(nextAvailability)
        }
      })
      .catch(() => {
        if (active) {
          setAuthAvailability({
            wechatEnabled: true,
            devEnabled: false,
            message: null,
          })
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function handleLogin(
    action: () => Promise<{ accessToken: string; onboardingCompleted?: boolean }>
  ) {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const session = await action()
      Taro.setStorageSync(ACCESS_TOKEN_STORAGE_KEY, session.accessToken)
      setAccessToken(session.accessToken)
      setHydrated(true)
      await navigateAfterLogin({
        inviteToken,
        onboardingCompleted: session.onboardingCompleted,
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '登录失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleWechatLogin() {
    await handleLogin(loginWithWechatCode)
  }

  async function handleDevLogin() {
    const normalizedEmail = email.trim()
    const normalizedDisplayName = displayName.trim()

    if (!normalizedEmail || !normalizedDisplayName) {
      setErrorMessage('请输入 dev email 和 display name')
      return
    }

    await handleLogin(() => loginWithDev(normalizedEmail, normalizedDisplayName))
  }

  return (
    <PageShell header={null} title={t('page_login_title')} subtitle={t('page_login_subtitle')}>
      <View
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '24px',
          backgroundColor: colors.surfaceMuted,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px',
        }}
      >
        <Text style={{ fontSize: '24px', color: colors.text, fontWeight: 700 }}>W</Text>
      </View>

      {inviteToken ? (
        <EmptyState title={t('login_invite_detected_title')} description={t('login_invite_detected_description')} />
      ) : null}

      <SectionCard title={t('login_welcome_title')}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>
            {t('login_intro')}
          </Text>
          {authAvailability ? (
            <>
              {authAvailability.wechatEnabled ? (
                <View onClick={handleWechatLogin} style={{ ...primaryButtonStyle, opacity: isSubmitting ? 0.7 : 1 }}>
                  <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
                    {isSubmitting ? t('login_submitting') : t('login_wechat')}
                  </Text>
                </View>
              ) : null}

              {authAvailability.devEnabled ? (
                <View style={{ padding: '12px', borderRadius: '14px', backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.border}` }}>
                  <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '10px' }}>
                    {t('login_dev_mode')}
                  </Text>
                  <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Input
                      placeholder={t('login_email_placeholder')}
                      value={email}
                      onInput={(event) => setEmail(event.detail.value)}
                      style={inputStyle}
                    />
                    <Input
                      placeholder={t('login_display_name_placeholder')}
                      value={displayName}
                      onInput={(event) => setDisplayName(event.detail.value)}
                      style={inputStyle}
                    />
                    <View onClick={handleDevLogin} style={{ ...secondaryButtonStyle, opacity: isSubmitting ? 0.7 : 1 }}>
                      <Text style={{ fontSize: '14px', color: colors.text }}>
                        {isSubmitting ? t('login_dev_submitting') : t('login_dev_submit')}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {!authAvailability.wechatEnabled && !authAvailability.devEnabled ? (
                <EmptyState
                  title={t('login_unavailable_title')}
                  description={authAvailability.message || '当前后端未配置可用的小程序登录方式。'}
                />
              ) : null}
            </>
          ) : (
            <Text style={{ fontSize: '13px', color: colors.textMuted }}>{t('login_loading_methods')}</Text>
          )}
        </View>
      </SectionCard>

      {errorMessage ? (
        <SectionCard title={t('login_failed_title')}>
          <Text style={{ fontSize: '13px', color: colors.danger }}>{errorMessage}</Text>
        </SectionCard>
      ) : null}

      <Text style={{ fontSize: '12px', color: colors.textSoft, lineHeight: 1.6 }}>
        {t('login_terms')}
      </Text>
    </PageShell>
  )
}
