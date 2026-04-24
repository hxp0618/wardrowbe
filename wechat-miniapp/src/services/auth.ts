import Taro from '@tarojs/taro'

import { api } from '../lib/api'

type AuthResponse = {
  id: string
  email: string
  display_name: string
  is_new_user: boolean
  onboarding_completed: boolean
  access_token: string
}

type AuthStatusResponse = {
  configured: boolean
  mode: 'unknown' | 'wechat' | 'wechat+dev' | 'dev' | 'oidc'
  error: string | null
}

type AuthConfigResponse = {
  oidc: {
    enabled: boolean
    issuer_url: string | null
    client_id: string | null
  }
  dev_mode: boolean
}

export type AuthSession = {
  id: string
  email: string
  displayName: string
  isNewUser: boolean
  onboardingCompleted: boolean
  accessToken: string
}

export type MiniappAuthAvailability = {
  wechatEnabled: boolean
  devEnabled: boolean
  message: string | null
}

function normalizeAuthSession(response: AuthResponse): AuthSession {
  return {
    id: response.id,
    email: response.email,
    displayName: response.display_name,
    isNewUser: response.is_new_user,
    onboardingCompleted: response.onboarding_completed,
    accessToken: response.access_token,
  }
}

export async function getMiniappAuthAvailability(): Promise<MiniappAuthAvailability> {
  const [status, config] = await Promise.all([
    api.get<AuthStatusResponse>('/auth/status'),
    api.get<AuthConfigResponse>('/auth/config'),
  ])

  const wechatEnabled = status.mode === 'wechat' || status.mode === 'wechat+dev'
  const devEnabled = config.dev_mode || status.mode === 'dev' || status.mode === 'wechat+dev'

  if (wechatEnabled || devEnabled) {
    return {
      wechatEnabled,
      devEnabled,
      message: null,
    }
  }

  return {
    wechatEnabled: false,
    devEnabled: false,
    message:
      status.error ||
      (status.mode === 'oidc'
        ? '当前后端仅配置了网页登录，未启用小程序登录。'
        : '当前后端未配置可用的小程序登录方式。'),
  }
}

export async function loginWithWechatCode(): Promise<AuthSession> {
  const loginResult = await Taro.login()

  if (!loginResult.code) {
    throw new Error('微信登录失败，请重试')
  }

  const response = await api.post<AuthResponse>('/auth/wechat/code', {
    code: loginResult.code,
  })

  return normalizeAuthSession(response)
}

export async function loginWithDev(
  email: string,
  displayName: string
): Promise<AuthSession> {
  const response = await api.post<AuthResponse>('/auth/dev-login', {
    email,
    display_name: displayName,
  })

  return normalizeAuthSession(response)
}
