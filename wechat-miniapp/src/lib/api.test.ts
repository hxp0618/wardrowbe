import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.fn()
const getStorageSync = vi.fn()

vi.mock('@tarojs/taro', () => ({
  default: {
    request,
    getStorageSync,
  },
}))

describe('miniapp api adapter', () => {
  beforeEach(() => {
    request.mockReset()
    getStorageSync.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('expands relative business API resource URLs before returning response data', async () => {
    vi.stubEnv('TARO_APP_API_BASE_URL', 'https://api.example.com/')
    request.mockResolvedValue({
      statusCode: 200,
      data: {
        items: [
          {
            id: 'item-1',
            thumbnail_url: '/api/v1/images/item-1-thumb.jpg?expires=1&sig=abc',
            image_url: 'https://cdn.example.com/item-1.jpg',
            additional_images: [
              {
                medium_url: '/api/v1/images/item-1-medium.jpg?expires=1&sig=def',
              },
            ],
          },
        ],
      },
    })

    const { api } = await import('./api')

    await expect(api.get('/items')).resolves.toEqual({
      items: [
        {
          id: 'item-1',
          thumbnail_url:
            'https://api.example.com/api/v1/images/item-1-thumb.jpg?expires=1&sig=abc',
          image_url: 'https://cdn.example.com/item-1.jpg',
          additional_images: [
            {
              medium_url:
                'https://api.example.com/api/v1/images/item-1-medium.jpg?expires=1&sig=def',
            },
          ],
        },
      ],
    })
  })
})
