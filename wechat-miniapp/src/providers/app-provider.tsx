import { ReactNode, useEffect } from 'react'

import Taro from '@tarojs/taro'

import { type AppAppearance, useAuthStore } from '../stores/auth'

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'
const APPEARANCE_STORAGE_KEY = 'appearance'

function normalizeStoredAccessToken(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  return value.length > 0 ? value : null
}

function normalizeStoredAppearance(value: unknown): AppAppearance {
  return value === 'dark' ? 'dark' : 'light'
}

export function restoreAccessTokenSession(
  storage: Pick<typeof Taro, 'getStorageSync'> = Taro
): string | null {
  const { setAccessToken, setAppearance, setHydrated } = useAuthStore.getState()
  let accessToken: string | null = null

  try {
    accessToken = normalizeStoredAccessToken(
      storage.getStorageSync<string | undefined>(ACCESS_TOKEN_STORAGE_KEY)
    )
    const appearance = normalizeStoredAppearance(
      storage.getStorageSync<string | undefined>(APPEARANCE_STORAGE_KEY)
    )

    setAccessToken(accessToken)
    setAppearance(appearance)
  } catch {
    setAccessToken(null)
    setAppearance('light')
  } finally {
    setHydrated(true)
  }

  return accessToken
}

type AppProviderProps = {
  children: ReactNode
}

export function AppProvider(props: AppProviderProps) {
  useEffect(() => {
    restoreAccessTokenSession()
  }, [])

  return <>{props.children}</>
}
