import { useState } from 'react'

import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { loginWithDev, loginWithWechatCode } from '../../services/auth'
import { useAuthStore } from '../../stores/auth'

const DASHBOARD_PAGE_URL = '/pages/dashboard/index'
const ONBOARDING_PAGE_URL = '/pages/onboarding/index'
const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'

export default function LoginPage() {
  const router = Taro.getCurrentInstance().router
  const inviteToken = router?.params?.inviteToken
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const setHydrated = useAuthStore((state) => state.setHydrated)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
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
      await Taro.redirectTo({
        url: inviteToken
          ? `/pages/invite/index?token=${encodeURIComponent(inviteToken)}`
          : session.onboardingCompleted
          ? DASHBOARD_PAGE_URL
          : ONBOARDING_PAGE_URL,
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
    <View>
      <Text>Wardrowbe Mini Program</Text>
      <Button type='primary' loading={isSubmitting} disabled={isSubmitting} onClick={handleWechatLogin}>
        微信登录
      </Button>
      <Input
        placeholder='dev email'
        value={email}
        onInput={(event) => setEmail(event.detail.value)}
      />
      <Input
        placeholder='display name'
        value={displayName}
        onInput={(event) => setDisplayName(event.detail.value)}
      />
      <Button disabled={isSubmitting} onClick={handleDevLogin}>
        Dev 登录
      </Button>
      {errorMessage ? <Text>{errorMessage}</Text> : null}
    </View>
  )
}
