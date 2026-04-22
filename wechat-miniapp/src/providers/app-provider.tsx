import { ReactNode, useEffect } from 'react'

import Taro from '@tarojs/taro'

import { useAuthStore } from '../stores/auth'

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'

function normalizeStoredAccessToken(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  return value.length > 0 ? value : null
}

export function restoreAccessTokenSession(
  storage: Pick<typeof Taro, 'getStorageSync'> = Taro
): string | null {
  const accessToken = normalizeStoredAccessToken(
    storage.getStorageSync<string | undefined>(ACCESS_TOKEN_STORAGE_KEY)
  )
  const { setAccessToken, setHydrated } = useAuthStore.getState()

  setAccessToken(accessToken)
  setHydrated(true)

  return accessToken
}

type AppProviderProps = {
  children: ReactNode
}

export function AppProvider(props: AppProviderProps) {
  const hydrated = useAuthStore((state) => state.hydrated)

  useEffect(() => {
    restoreAccessTokenSession()
  }, [])

  if (!hydrated) {
    return null
  }

  return <>{props.children}</>
}
