import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const uploadFile = vi.fn()
const getStorageSync = vi.fn()

vi.mock('@tarojs/taro', () => ({
  default: {
    uploadFile,
    getStorageSync,
  },
}))

describe('uploadApiFile', () => {
  beforeEach(() => {
    uploadFile.mockReset()
    getStorageSync.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('uploads files through the configured business API origin with auth headers', async () => {
    vi.stubEnv('TARO_APP_API_BASE_URL', 'https://api.example.com/')
    uploadFile.mockResolvedValue({
      statusCode: 201,
      data: JSON.stringify({ id: 'item-1' }),
    })

    const { useAuthStore } = await import('../stores/auth')
    useAuthStore.setState({ accessToken: 'store-token' })

    const { uploadApiFile } = await import('./api-upload')

    await expect(
      uploadApiFile<{ id: string }>({
        endpoint: '/items',
        filePath: 'cover.jpg',
        name: 'image',
        formData: { type: 'coat' },
      })
    ).resolves.toEqual({ id: 'item-1' })

    expect(uploadFile).toHaveBeenCalledWith({
      url: 'https://api.example.com/api/v1/items',
      filePath: 'cover.jpg',
      name: 'image',
      header: {
        'Accept-Language': 'zh-CN',
        Authorization: 'Bearer store-token',
      },
      formData: { type: 'coat' },
    })
  })

  it('falls back to stored auth token and rejects failed upload responses', async () => {
    getStorageSync.mockReturnValue('stored-token')
    uploadFile.mockResolvedValue({
      statusCode: 500,
      data: { detail: 'failed' },
    })

    const { useAuthStore } = await import('../stores/auth')
    useAuthStore.setState({ accessToken: null })

    const { uploadApiFile } = await import('./api-upload')

    await expect(
      uploadApiFile({
        endpoint: '/items',
        filePath: 'cover.jpg',
        name: 'image',
      })
    ).rejects.toThrow('上传失败，请稍后重试')

    expect(uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        header: {
          'Accept-Language': 'zh-CN',
          Authorization: 'Bearer stored-token',
        },
      })
    )
  })
})
