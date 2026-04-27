import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'

const getCurrentInstance = vi.fn()
const useEffect = vi.fn()
const setState = vi.fn()

vi.mock('@tarojs/components', () => ({
  Input: 'input',
  Text: 'text',
  View: 'view',
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')

  return {
    ...actual,
    useEffect,
    useState: (initialValue: unknown) => [initialValue, setState],
  }
})

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
    useEffect.mockReset()
    setState.mockReset()
  })

  it('returns an undefined invite token when reading the current route throws', async () => {
    getCurrentInstance.mockImplementation(() => {
      throw new Error('timeout')
    })

    const { resolveInviteToken } = await import('./index')

    expect(resolveInviteToken()).toBeUndefined()
  })

  it('renders the normal login shell instead of the debug placeholder', async () => {
    getCurrentInstance.mockReturnValue({ router: { params: {} } })

    const { default: LoginPage } = await import('./index')
    const page = LoginPage() as ReactElement

    expect(page.type).toBe('page-shell')
    expect(page.props.title).toBe('page_login_title')
    expect(JSON.stringify(page)).not.toContain('Wardrowbe Login Debug')
  })
})
