import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSetting = vi.fn()
const authorize = vi.fn()
const getLocation = vi.fn()
const chooseLocation = vi.fn()

vi.mock('@tarojs/taro', () => ({
  default: {
    getSetting,
    authorize,
    getLocation,
    chooseLocation,
  },
}))

describe('chooseWechatLocation', () => {
  beforeEach(() => {
    vi.resetModules()
    getSetting.mockReset()
    authorize.mockReset()
    getLocation.mockReset()
    chooseLocation.mockReset()
    delete (globalThis as { wx?: unknown }).wx
  })

  it('authorizes location access before choosing a location when permission is undecided', async () => {
    getSetting.mockResolvedValue({ authSetting: {} })
    authorize.mockResolvedValue(undefined)
    getLocation.mockResolvedValue({
      latitude: 31.2304,
      longitude: 121.4737,
    })
    chooseLocation.mockResolvedValue({
      name: 'Shanghai',
      address: 'Shanghai',
      latitude: 31.2304,
      longitude: 121.4737,
    })

    const { chooseWechatLocation } = await import('./wechat-location')

    await expect(chooseWechatLocation()).resolves.toEqual({
      name: 'Shanghai',
      address: 'Shanghai',
      latitude: 31.2304,
      longitude: 121.4737,
    })

    expect(authorize).toHaveBeenCalledWith({ scope: 'scope.userLocation' })
    expect(getLocation).toHaveBeenCalledWith({ type: 'gcj02' })
    expect(chooseLocation).toHaveBeenCalledWith({
      latitude: 31.2304,
      longitude: 121.4737,
    })
  })

  it('reports a permission error when location permission was previously denied', async () => {
    getSetting.mockResolvedValue({ authSetting: { 'scope.userLocation': false } })

    const { chooseWechatLocation, WechatLocationError } = await import('./wechat-location')

    await expect(chooseWechatLocation()).rejects.toMatchObject({
      code: 'permission-denied',
    })

    expect(authorize).not.toHaveBeenCalled()
    expect(chooseLocation).not.toHaveBeenCalled()
  })

  it('reports cancellation when the user closes the location picker', async () => {
    getSetting.mockResolvedValue({ authSetting: { 'scope.userLocation': true } })
    getLocation.mockResolvedValue({
      latitude: 31.2304,
      longitude: 121.4737,
    })
    chooseLocation.mockRejectedValue({
      errMsg: 'chooseLocation:fail cancel',
    })

    const { chooseWechatLocation, WechatLocationError } = await import('./wechat-location')

    await expect(chooseWechatLocation()).rejects.toMatchObject({
      code: 'canceled',
    })
  })

  it('uses the Taro location apis even when native wx is available', async () => {
    getSetting.mockResolvedValue({ authSetting: {} })
    authorize.mockResolvedValue(undefined)
    getLocation.mockResolvedValue({
      latitude: 30.2741,
      longitude: 120.1551,
    })
    chooseLocation.mockResolvedValue({
      name: 'Hangzhou',
      address: 'Hangzhou',
      latitude: 30.2741,
      longitude: 120.1551,
    })

    const nativeGetSetting = vi.fn().mockResolvedValue({ authSetting: {} })
    const nativeAuthorize = vi.fn().mockResolvedValue(undefined)
    const nativeGetLocation = vi.fn().mockResolvedValue({
      latitude: 30.2741,
      longitude: 120.1551,
    })
    const nativeChooseLocation = vi.fn().mockResolvedValue({
      name: 'Hangzhou',
      address: 'Hangzhou',
      latitude: 30.2741,
      longitude: 120.1551,
    })

    ;(globalThis as { wx?: unknown }).wx = {
      getSetting: nativeGetSetting,
      authorize: nativeAuthorize,
      getLocation: nativeGetLocation,
      chooseLocation: nativeChooseLocation,
    }

    const { chooseWechatLocation } = await import('./wechat-location')

    await expect(chooseWechatLocation()).resolves.toEqual({
      name: 'Hangzhou',
      address: 'Hangzhou',
      latitude: 30.2741,
      longitude: 120.1551,
    })

    expect(getSetting).toHaveBeenCalledTimes(1)
    expect(authorize).toHaveBeenCalledWith({ scope: 'scope.userLocation' })
    expect(getLocation).toHaveBeenCalledWith({ type: 'gcj02' })
    expect(chooseLocation).toHaveBeenCalledWith({
      latitude: 30.2741,
      longitude: 120.1551,
    })
    expect(nativeGetSetting).not.toHaveBeenCalled()
    expect(nativeAuthorize).not.toHaveBeenCalled()
    expect(nativeGetLocation).not.toHaveBeenCalled()
    expect(nativeChooseLocation).not.toHaveBeenCalled()
  })
})
