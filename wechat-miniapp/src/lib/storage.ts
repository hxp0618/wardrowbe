import Taro from '@tarojs/taro'

import type { AppAppearance } from '../stores/auth'

export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'
export const APPEARANCE_STORAGE_KEY = 'appearance'

type StorageReader = Pick<typeof Taro, 'getStorageSync'>
type StorageWriter = Pick<typeof Taro, 'setStorageSync'>
type StorageRemover = Pick<typeof Taro, 'removeStorageSync'>

function normalizeStoredString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export function getStoredAccessToken(storage: StorageReader = Taro): string | null {
  return normalizeStoredString(storage.getStorageSync<string | undefined>(ACCESS_TOKEN_STORAGE_KEY))
}

export function setStoredAccessToken(
  accessToken: string,
  storage: StorageWriter = Taro
): void {
  storage.setStorageSync(ACCESS_TOKEN_STORAGE_KEY, accessToken)
}

export function clearStoredAccessToken(storage: StorageRemover = Taro): void {
  storage.removeStorageSync(ACCESS_TOKEN_STORAGE_KEY)
}

export function getStoredAppearance(storage: StorageReader = Taro): AppAppearance {
  const appearance = normalizeStoredString(
    storage.getStorageSync<string | undefined>(APPEARANCE_STORAGE_KEY)
  )

  return appearance === 'dark' ? 'dark' : 'light'
}

export function setStoredAppearance(
  appearance: AppAppearance,
  storage: StorageWriter = Taro
): void {
  storage.setStorageSync(APPEARANCE_STORAGE_KEY, appearance)
}
