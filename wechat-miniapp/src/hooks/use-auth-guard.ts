import { useEffect } from 'react'

import Taro from '@tarojs/taro'

import { useAuthStore } from '../stores/auth'

const LOGIN_PAGE_URL = '/pages/login/index'

export function useAuthGuard(loginPageUrl = LOGIN_PAGE_URL): boolean {
  const accessToken = useAuthStore((state) => state.accessToken)
  const hydrated = useAuthStore((state) => state.hydrated)
  const loginTarget = loginPageUrl || LOGIN_PAGE_URL

  useEffect(() => {
    if (hydrated && !accessToken) {
      void Taro.redirectTo({ url: loginTarget })
    }
  }, [accessToken, hydrated, loginTarget])

  return hydrated && !!accessToken
}
