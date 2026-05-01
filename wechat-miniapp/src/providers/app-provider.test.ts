import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureMiniappQueryRuntime } from './app-provider'

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: vi.fn(),
  },
}))

const originalAbortController = globalThis.AbortController

describe('configureMiniappQueryRuntime', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'AbortController', {
      configurable: true,
      writable: true,
      value: originalAbortController,
    })
  })

  it('keeps TanStack queries usable when the miniapp runtime has no AbortController', async () => {
    Object.defineProperty(globalThis, 'AbortController', {
      configurable: true,
      writable: true,
      value: undefined,
    })

    configureMiniappQueryRuntime()

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    await expect(
      queryClient.fetchQuery({
        queryKey: ['miniapp', 'runtime'],
        queryFn: async () => 'ready',
      })
    ).resolves.toBe('ready')
  })
})
