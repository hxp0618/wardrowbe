import { useState } from 'react'

import { Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, inputStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { loginWithDev, loginWithWechatCode } from '../../services/auth'
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
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const setHydrated = useAuthStore((state) => state.setHydrated)
  const [email, setEmail] = useState('dev@wardrobe.local')
  const [displayName, setDisplayName] = useState('Dev User')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    <PageShell header={null} title='登录 Wardrowbe' subtitle='使用微信或开发模式账号继续'>
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
        <EmptyState title='检测到家庭邀请' description='登录后会自动继续加入家庭流程。' />
      ) : null}

      <SectionCard title='欢迎回来'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>
            登录后会直接进入首页；如果当前链接带有家庭邀请，会自动继续邀请流程。
          </Text>
          <View onClick={handleWechatLogin} style={{ ...primaryButtonStyle, opacity: isSubmitting ? 0.7 : 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
              {isSubmitting ? '登录中...' : '微信登录'}
            </Text>
          </View>

          <View style={{ padding: '12px', borderRadius: '14px', backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.border}` }}>
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '10px' }}>
              开发模式
            </Text>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Input
                placeholder='邮箱'
                value={email}
                onInput={(event) => setEmail(event.detail.value)}
                style={inputStyle}
              />
              <Input
                placeholder='显示名称'
                value={displayName}
                onInput={(event) => setDisplayName(event.detail.value)}
                style={inputStyle}
              />
              <View onClick={handleDevLogin} style={{ ...secondaryButtonStyle, opacity: isSubmitting ? 0.7 : 1 }}>
                <Text style={{ fontSize: '14px', color: colors.text }}>
                  {isSubmitting ? '提交中...' : 'Dev 登录'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </SectionCard>

      {errorMessage ? (
        <SectionCard title='登录失败'>
          <Text style={{ fontSize: '13px', color: colors.danger }}>{errorMessage}</Text>
        </SectionCard>
      ) : null}

      <Text style={{ fontSize: '12px', color: colors.textSoft, lineHeight: 1.6 }}>
        继续即表示你同意使用 Wardrowbe 提供的登录与穿搭服务。
      </Text>
    </PageShell>
  )
}
