import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.fn()

vi.mock('@tarojs/taro', () => ({
  default: {
    request,
  },
}))

describe('wechat location geocoding', () => {
  beforeEach(() => {
    vi.resetModules()
    request.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('geocodes a typed location name with Tencent Maps', async () => {
    vi.stubGlobal('LOCATION_APIKEY', 'test-map-key')
    request.mockResolvedValue({
      data: {
        status: 0,
        result: {
          title: 'Shanghai',
          address: 'Shanghai',
          location: {
            lat: 31.2304,
            lng: 121.4737,
          },
        },
      },
    })

    const { resolveWechatLocationName } = await import('./wechat-location')

    await expect(resolveWechatLocationName(' Shanghai ')).resolves.toEqual({
      name: 'Shanghai',
      address: 'Shanghai',
      latitude: 31.2304,
      longitude: 121.4737,
    })

    expect(request).toHaveBeenCalledWith({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      method: 'GET',
      data: {
        address: 'Shanghai',
        key: 'test-map-key',
      },
    })
  })
})
