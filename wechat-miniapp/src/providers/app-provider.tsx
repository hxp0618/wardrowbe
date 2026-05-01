import { ReactNode, useEffect } from 'react'

import Taro from '@tarojs/taro'
import { focusManager, onlineManager } from '@tanstack/react-query'

import { getStoredAccessToken, getStoredAppearance } from '../lib/storage'
import { useAuthStore } from '../stores/auth'

type MiniappAbortEvent = {
  type: 'abort'
}

type MiniappAbortListener = (event: MiniappAbortEvent) => void

class MiniappAbortSignal {
  aborted = false
  onabort: MiniappAbortListener | null = null
  reason: unknown

  private readonly listeners = new Set<MiniappAbortListener>()

  addEventListener(type: string, listener: MiniappAbortListener): void {
    if (type !== 'abort') return
    this.listeners.add(listener)
  }

  removeEventListener(type: string, listener: MiniappAbortListener): void {
    if (type !== 'abort') return
    this.listeners.delete(listener)
  }

  dispatchEvent(event: MiniappAbortEvent): boolean {
    if (event.type !== 'abort') return true

    this.onabort?.(event)
    this.listeners.forEach((listener) => listener(event))
    return true
  }

  throwIfAborted(): void {
    if (!this.aborted) return
    throw this.reason ?? new Error('AbortError')
  }

  abort(reason?: unknown): void {
    if (this.aborted) return

    this.aborted = true
    this.reason = reason
    this.dispatchEvent({ type: 'abort' })
  }
}

class MiniappAbortController {
  readonly signal = new MiniappAbortSignal() as AbortSignal

  abort(reason?: unknown): void {
    ;(this.signal as unknown as MiniappAbortSignal).abort(reason)
  }
}

function configureAbortControllerFallback(): void {
  if (typeof globalThis.AbortController === 'function') return

  Object.defineProperty(globalThis, 'AbortSignal', {
    configurable: true,
    writable: true,
    value: MiniappAbortSignal as unknown as typeof AbortSignal,
  })
  Object.defineProperty(globalThis, 'AbortController', {
    configurable: true,
    writable: true,
    value: MiniappAbortController as unknown as typeof AbortController,
  })
}

export function configureMiniappQueryRuntime(): void {
  configureAbortControllerFallback()
  onlineManager.setOnline(true)
  focusManager.setFocused(true)
}

export function restoreAccessTokenSession(
  storage: Pick<typeof Taro, 'getStorageSync'> = Taro
): string | null {
  const { setAccessToken, setAppearance, setHydrated } = useAuthStore.getState()
  let accessToken: string | null = null

  try {
    accessToken = getStoredAccessToken(storage)
    const appearance = getStoredAppearance(storage)

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
    configureMiniappQueryRuntime()
    restoreAccessTokenSession()
  }, [])

  return <>{props.children}</>
}
