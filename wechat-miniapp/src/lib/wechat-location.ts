import Taro from '@tarojs/taro'

declare const LOCATION_APIKEY: string | undefined

type LocationErrorCode = 'permission-denied' | 'canceled' | 'unavailable'

export class WechatLocationError extends Error {
  code: LocationErrorCode

  constructor(code: LocationErrorCode, message?: string) {
    super(message || code)
    this.name = 'WechatLocationError'
    this.code = code
  }
}

type MiniProgramChooseLocationResult = {
  name: string
  address: string
  latitude: number
  longitude: number
}

type MiniProgramGetLocationResult = {
  latitude: number
  longitude: number
}

type TencentGeocoderResponse = {
  status: number
  message?: string
  result?: {
    title?: string
    address?: string
    location?: {
      lat?: number
      lng?: number
    }
  }
}

type MiniProgramApi = {
  getSetting: typeof Taro.getSetting
  authorize: typeof Taro.authorize
  getLocation: (
    option: {
      type: 'gcj02'
    }
  ) => Promise<MiniProgramGetLocationResult>
  chooseLocation: (
    option: {
      latitude: number
      longitude: number
    }
  ) => Promise<MiniProgramChooseLocationResult>
}

function resolveMiniProgramApi(): MiniProgramApi {
  return {
    getSetting: Taro.getSetting,
    authorize: Taro.authorize,
    getLocation: (option) => Taro.getLocation(option),
    chooseLocation: (option) => Taro.chooseLocation(option),
  }
}

function normalizeLocationError(error: unknown): WechatLocationError {
  const rawMessage =
    (error &&
      typeof error === 'object' &&
      'errMsg' in error &&
      typeof (error as { errMsg?: unknown }).errMsg === 'string' &&
      (error as { errMsg: string }).errMsg) ||
    (error instanceof Error ? error.message : '')

  const message = String(rawMessage).toLowerCase()

  if (
    message.includes('auth deny') ||
    message.includes('auth denied') ||
    message.includes('authorize:no permission') ||
    message.includes('permission denied')
  ) {
    return new WechatLocationError('permission-denied')
  }

  if (message.includes('cancel')) {
    return new WechatLocationError('canceled')
  }

  return new WechatLocationError('unavailable')
}

function resolveLocationApiKey(): string {
  return typeof LOCATION_APIKEY === 'string' ? LOCATION_APIKEY.trim() : ''
}

export async function chooseWechatLocation() {
  const miniProgramApi = resolveMiniProgramApi()

  try {
    const settingResult = await miniProgramApi.getSetting()
    const authSetting = settingResult.authSetting || {}

    if (authSetting['scope.userLocation'] === false) {
      throw new WechatLocationError('permission-denied')
    }

    if (authSetting['scope.userLocation'] !== true) {
      await miniProgramApi.authorize({ scope: 'scope.userLocation' })
    }

    const currentLocation = await miniProgramApi.getLocation({ type: 'gcj02' })

    return await miniProgramApi.chooseLocation({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    })
  } catch (error) {
    if (error instanceof WechatLocationError) {
      throw error
    }

    throw normalizeLocationError(error)
  }
}

export async function resolveWechatLocationName(locationName: string) {
  const address = locationName.trim()
  const key = resolveLocationApiKey()

  if (!address || !key) {
    throw new WechatLocationError('unavailable')
  }

  try {
    const response = await Taro.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      method: 'GET',
      data: {
        address,
        key,
      },
    })
    const data = response.data as TencentGeocoderResponse
    const location = data.result?.location
    const latitude = location?.lat
    const longitude = location?.lng

    if (
      data.status !== 0 ||
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      throw new WechatLocationError('unavailable', data.message)
    }

    return {
      name: data.result?.title || address,
      address: data.result?.address || address,
      latitude,
      longitude,
    }
  } catch (error) {
    if (error instanceof WechatLocationError) {
      throw error
    }

    throw normalizeLocationError(error)
  }
}
