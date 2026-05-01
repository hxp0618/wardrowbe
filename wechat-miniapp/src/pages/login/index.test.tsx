import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirectTo = vi.fn()
const setStorageSync = vi.fn()
const switchTab = vi.fn()
const bootstrapMiniappSession = vi.fn()

vi.mock('@tarojs/components', () => ({
  Input: 'Input',
  Text: 'Text',
  View: 'View',
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getCurrentInstance: () => ({ router: { params: {} } }),
    redirectTo,
    setStorageSync,
    switchTab,
  },
}))

vi.mock('../../services/session-bootstrap', () => ({
  bootstrapMiniappSession,
}))

describe('completeAuthenticatedLogin', () => {
  beforeEach(() => {
    redirectTo.mockReset()
    setStorageSync.mockReset()
    switchTab.mockReset()
    bootstrapMiniappSession.mockReset()
  })

  it('clears cached miniapp queries before bootstrapping the logged-in session', async () => {
    const removeQueries = vi.fn()
    bootstrapMiniappSession.mockImplementation(async () => {
      expect(removeQueries).toHaveBeenCalledWith({ queryKey: ['miniapp'] })
      return { onboarding_completed: true }
    })

    const { completeAuthenticatedLogin } = await import('./index')

    await completeAuthenticatedLogin({
      session: {
        id: 'user-1',
        email: 'dev@wardrobe.local',
        displayName: 'Dev User',
        isNewUser: false,
        onboardingCompleted: true,
        accessToken: 'new-token',
      },
      queryClient: {
        fetchQuery: vi.fn(),
        prefetchQuery: vi.fn(),
        removeQueries,
      },
      setAccessToken: vi.fn(),
      setHydrated: vi.fn(),
    })

    expect(switchTab).toHaveBeenCalledWith({ url: '/pages/dashboard/index' })
  })
})
