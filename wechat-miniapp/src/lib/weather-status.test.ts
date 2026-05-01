import { describe, expect, it } from 'vitest'

import {
  getWeatherErrorMessage,
  hasWeatherCoordinates,
  resolveWeatherPanelState,
} from './weather-status'

describe('weather status helpers', () => {
  it('detects saved weather coordinates from the user profile', () => {
    expect(hasWeatherCoordinates({ location_lat: 31.2304, location_lon: 121.4737 })).toBe(true)
    expect(hasWeatherCoordinates({ location_lat: 31.2304, location_lon: null })).toBe(false)
  })

  it('keeps missing location separate from weather request errors', () => {
    expect(
      resolveWeatherPanelState({
        profileLoading: false,
        weatherLoading: false,
        hasLocation: false,
        hasWeather: false,
        error: new Error('天气服务不可用'),
      })
    ).toBe('missing-location')

    expect(
      resolveWeatherPanelState({
        profileLoading: false,
        weatherLoading: false,
        hasLocation: true,
        hasWeather: false,
        error: new Error('天气服务不可用'),
      })
    ).toBe('error')
  })

  it('uses a readable weather error fallback', () => {
    expect(getWeatherErrorMessage(new Error('天气服务不可用'), '同步失败')).toBe('天气服务不可用')
    expect(getWeatherErrorMessage(null, '同步失败')).toBe('同步失败')
  })
})
