import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const taroLogin = vi.fn()
const apiPost = vi.fn()
const apiGet = vi.fn()

vi.mock('@tarojs/taro', () => ({
  default: {
    login: taroLogin,
  },
}))

vi.mock('../lib/api', () => ({
  api: {
    post: apiPost,
    get: apiGet,
  },
}))

describe('auth services', () => {
  beforeEach(() => {
    taroLogin.mockReset()
    apiPost.mockReset()
    apiGet.mockReset()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('exchanges a wechat login code for an auth session', async () => {
    taroLogin.mockResolvedValue({ code: 'wechat-code-123' })
    apiPost.mockResolvedValue({
      id: 'user-1',
      email: 'wechat@example.com',
      display_name: '微信用户-123456',
      is_new_user: true,
      onboarding_completed: false,
      access_token: 'access-token-1',
    })

    const { loginWithWechatCode } = await import('./auth')

    await expect(loginWithWechatCode()).resolves.toEqual({
      id: 'user-1',
      email: 'wechat@example.com',
      displayName: '微信用户-123456',
      isNewUser: true,
      onboardingCompleted: false,
      accessToken: 'access-token-1',
    })

    expect(taroLogin).toHaveBeenCalledTimes(1)
    expect(apiPost).toHaveBeenCalledWith('/auth/wechat/code', {
      code: 'wechat-code-123',
    })
  })

  it('submits dev login payload with display_name', async () => {
    apiPost.mockResolvedValue({
      id: 'user-2',
      email: 'dev@example.com',
      display_name: 'Dev User',
      is_new_user: false,
      onboarding_completed: true,
      access_token: 'access-token-2',
    })

    const { loginWithDev } = await import('./auth')

    await expect(loginWithDev('dev@example.com', 'Dev User')).resolves.toEqual({
      id: 'user-2',
      email: 'dev@example.com',
      displayName: 'Dev User',
      isNewUser: false,
      onboardingCompleted: true,
      accessToken: 'access-token-2',
    })

    expect(apiPost).toHaveBeenCalledWith('/auth/dev-login', {
      email: 'dev@example.com',
      display_name: 'Dev User',
    })
  })

  it('reports supported miniapp login methods from auth status and config', async () => {
    apiGet
      .mockResolvedValueOnce({
        configured: true,
        mode: 'wechat+dev',
        error: null,
      })
      .mockResolvedValueOnce({
        oidc: { enabled: false, issuer_url: null, client_id: null },
        dev_mode: true,
      })

    const { getMiniappAuthAvailability } = await import('./auth')

    await expect(getMiniappAuthAvailability()).resolves.toEqual({
      wechatEnabled: true,
      devEnabled: true,
      message: null,
    })
  })

  it('surfaces a backend configuration message when no miniapp auth method is configured', async () => {
    apiGet
      .mockResolvedValueOnce({
        configured: false,
        mode: 'unknown',
        error: '未配置登录方式。请设置 OIDC_ISSUER_URL 与 OIDC_CLIENT_ID，或开启 DEBUG 模式。',
      })
      .mockResolvedValueOnce({
        oidc: { enabled: false, issuer_url: null, client_id: null },
        dev_mode: false,
      })

    const { getMiniappAuthAvailability } = await import('./auth')

    await expect(getMiniappAuthAvailability()).resolves.toEqual({
      wechatEnabled: false,
      devEnabled: false,
      message: '未配置登录方式。请设置 OIDC_ISSUER_URL 与 OIDC_CLIENT_ID，或开启 DEBUG 模式。',
    })
  })
})
