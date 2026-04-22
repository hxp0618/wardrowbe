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

export type AuthSession = {
  id: string
  email: string
  displayName: string
  isNewUser: boolean
  onboardingCompleted: boolean
  accessToken: string
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
