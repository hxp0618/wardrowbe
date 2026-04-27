import { beforeEach, describe, expect, it, vi } from 'vitest'

const getCurrentInstance = vi.fn()

vi.mock('@tarojs/components', () => ({
  Input: 'input',
  Text: 'text',
  View: 'view',
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getCurrentInstance,
  },
}))

vi.mock('../../components/empty-state', () => ({
  EmptyState: 'empty-state',
}))

vi.mock('../../components/editorial-style', () => ({
  getEditorialCardStyle: () => ({}),
  getEditorialCompactButtonStyle: () => ({}),
  getEditorialFeatureCardStyle: () => ({}),
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: 'page-shell',
}))

vi.mock('../../components/section-card', () => ({
  SectionCard: 'section-card',
}))

vi.mock('../../components/ui-theme', () => ({
  colors: {},
  inputStyle: {},
  primaryButtonStyle: {},
  secondaryButtonStyle: {},
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../../services/auth', () => ({
  getMiniappAuthAvailability: vi.fn(),
  loginWithDev: vi.fn(),
  loginWithWechatCode: vi.fn(),
}))

vi.mock('../../stores/auth', () => ({
  useAuthStore: (selector: (state: {
    setAccessToken: () => void
    setHydrated: () => void
  }) => unknown) =>
    selector({
      setAccessToken: () => undefined,
      setHydrated: () => undefined,
    }),
}))

describe('login page helpers', () => {
  beforeEach(() => {
    vi.resetModules()
    getCurrentInstance.mockReset()
  })

  it('returns an undefined invite token when reading the current route throws', async () => {
    getCurrentInstance.mockImplementation(() => {
      throw new Error('timeout')
    })

    const { resolveInviteToken } = await import('./index')

    expect(resolveInviteToken()).toBeUndefined()
  })
})
