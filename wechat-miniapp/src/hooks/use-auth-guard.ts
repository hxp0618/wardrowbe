import { useEffect } from 'react'

import Taro from '@tarojs/taro'

import { useAuthStore } from '../stores/auth'

const LOGIN_PAGE_URL = '/pages/login/index'

export function useAuthGuard(): boolean {
  const accessToken = useAuthStore((state) => state.accessToken)
  const hydrated = useAuthStore((state) => state.hydrated)

  useEffect(() => {
    if (hydrated && !accessToken) {
      void Taro.redirectTo({ url: LOGIN_PAGE_URL })
    }
  }, [accessToken, hydrated])

  return hydrated && !!accessToken
}
