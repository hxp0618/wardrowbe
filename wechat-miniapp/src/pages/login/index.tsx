import { useEffect, useState } from 'react'

import { Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import { EmptyState } from '../../components/empty-state'
import { getActionButtonStyle, getEnabledActionHandler } from '../../components/action-style'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, inputStyle } from '../../components/ui-theme'
import { useI18n } from '../../lib/i18n'
import { clearStoredAccessToken, setStoredAccessToken } from '../../lib/storage'
import {
  getMiniappAuthAvailability,
  loginWithDev,
  loginWithWechatCode,
  type AuthSession,
  type MiniappAuthAvailability,
} from '../../services/auth'
import { bootstrapMiniappSession } from '../../services/session-bootstrap'
import { useAuthStore } from '../../stores/auth'

const DASHBOARD_PAGE_URL = '/pages/dashboard/index'
const ONBOARDING_PAGE_URL = '/pages/onboarding/index'

export function resolveInviteToken(): string | undefined {
  try {
    const inviteToken = Taro.getCurrentInstance().router?.params?.inviteToken
    return typeof inviteToken === 'string' && inviteToken.length > 0
      ? inviteToken
      : undefined
  } catch {
    return undefined
  }
}

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

type LoginQueryClient = Pick<QueryClient, 'fetchQuery' | 'prefetchQuery' | 'removeQueries'>

export async function completeAuthenticatedLogin(options: {
  session: AuthSession
  queryClient: LoginQueryClient
  inviteToken?: string
  setAccessToken: (accessToken: string | null) => void
  setHydrated: (hydrated: boolean) => void
}) {
  setStoredAccessToken(options.session.accessToken)
  options.setAccessToken(options.session.accessToken)
  options.setHydrated(true)
  options.queryClient.removeQueries({ queryKey: ['miniapp'] })

  let profile: Awaited<ReturnType<typeof bootstrapMiniappSession>>
  try {
    profile = await bootstrapMiniappSession(options.queryClient)
  } catch (error) {
    // Bootstrap failure leaves the persisted token pointing at a session we
    // never finished authenticating. Roll it back so the next launch starts
    // clean instead of silently retrying with a half-broken state.
    clearStoredAccessToken()
    options.setAccessToken(null)
    options.setHydrated(false)
    throw error
  }

  await navigateAfterLogin({
    inviteToken: options.inviteToken,
    onboardingCompleted:
      profile?.onboarding_completed ?? options.session.onboardingCompleted,
  })
}

export default function LoginPage() {
  const inviteToken = resolveInviteToken()
  const { t } = useI18n()
  const queryClient = useQueryClient()
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

  async function handleLogin(action: () => Promise<AuthSession>) {
    if (isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const session = await action()
      await completeAuthenticatedLogin({
        session,
        inviteToken,
        queryClient,
        setAccessToken,
        setHydrated,
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('login_fallback_error'))
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
      setErrorMessage(t('login_dev_missing_fields'))
      return
    }

    await handleLogin(() => loginWithDev(normalizedEmail, normalizedDisplayName))
  }

  return (
    <PageShell header={null} title={t('page_login_title')} subtitle={t('page_login_subtitle')}>
      {inviteToken ? (
        <EmptyState
          title={t('login_invite_detected_title')}
          description={t('login_invite_detected_description')}
        />
      ) : null}

      <SectionCard compact title={t('login_welcome_title')}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>
            {t('login_intro')}
          </Text>

          {authAvailability ? (
            <>
              {authAvailability.wechatEnabled ? (
                <View ariaRole='button' ariaLabel={t('login_wechat')} onClick={getEnabledActionHandler(isSubmitting, handleWechatLogin)} style={getActionButtonStyle({ variant: 'primary', disabled: isSubmitting })}>
                  <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
                    {isSubmitting ? t('login_submitting') : t('login_wechat')}
                  </Text>
                </View>
              ) : null}

              {authAvailability.devEnabled ? (
                <View
                  style={{
                    paddingTop: '12px',
                    borderTop: `1px solid ${colors.border}`,
                  }}
                >
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
                    <View ariaRole='button' ariaLabel={t('login_dev_submit')} onClick={getEnabledActionHandler(isSubmitting, handleDevLogin)} style={getActionButtonStyle({ disabled: isSubmitting })}>
                      <Text style={{ fontSize: '14px', color: colors.text }}>
                        {isSubmitting ? t('login_dev_submitting') : t('login_dev_submit')}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {!authAvailability.wechatEnabled && !authAvailability.devEnabled ? (
                <EmptyState
                  embedded
                  title={t('login_unavailable_title')}
                  description={authAvailability.message || t('login_unavailable_default')}
                />
              ) : null}
            </>
          ) : (
            <Text style={{ fontSize: '13px', color: colors.textMuted }}>
              {t('login_loading_methods')}
            </Text>
          )}
        </View>
      </SectionCard>

      {errorMessage ? (
        <SectionCard compact title={t('login_failed_title')}>
          <Text style={{ fontSize: '13px', color: colors.danger }}>{errorMessage}</Text>
        </SectionCard>
      ) : null}

      <Text style={{ fontSize: '12px', color: colors.textSoft, lineHeight: 1.6 }}>
        {t('login_terms')}
      </Text>
    </PageShell>
  )
}
