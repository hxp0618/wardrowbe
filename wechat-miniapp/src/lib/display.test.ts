import { describe, expect, it } from 'vitest'

import {
  formatColorLabel,
  formatItemTypeLabel,
  formatNotificationChannelLabel,
  formatOutfitDetailLabel,
  formatTemperature,
  formatWeatherConditionLabel,
} from './display'

describe('display label formatting', () => {
  it('uses the requested locale label table', () => {
    expect(formatItemTypeLabel('coat')).toBe('大衣')
    expect(formatItemTypeLabel('coat', 'en')).toBe('Coat')
  })

  it('localizes analytics item type and color values', () => {
    expect(formatItemTypeLabel('shirt')).toBe('衬衫')
    expect(formatColorLabel('tan')).toBe('棕褐色')
  })

  it('formats underscore notification channel values', () => {
    expect(formatNotificationChannelLabel('expo_push')).toBe('Expo Push')
    expect(formatNotificationChannelLabel('wechat_work')).toBe('企业微信')
    expect(formatNotificationChannelLabel('wechat_work', 'en')).toBe('WeCom')
  })

  it('localizes weather condition variants returned by weather and outfit APIs', () => {
    expect(formatWeatherConditionLabel('rainy')).toBe('雨')
    expect(formatWeatherConditionLabel('Light Rain')).toBe('小雨')
    expect(formatWeatherConditionLabel('mostly sunny')).toBe('晴间多云')
    expect(formatWeatherConditionLabel('thunderstorm with hail')).toBe('雷暴伴冰雹')
  })

  it('formats outfit detail action labels from outfit names or occasions', () => {
    expect(formatOutfitDetailLabel({ name: '周末穿搭', occasion: 'casual' })).toBe('查看周末穿搭详情')
    expect(formatOutfitDetailLabel({ name: null, occasion: 'office' })).toBe('查看办公详情')
  })

  it('formats temperatures for the selected unit', () => {
    expect(formatTemperature(20.4, 'celsius')).toBe('20°C')
    expect(formatTemperature(20.4, 'fahrenheit')).toBe('69°F')
    expect(formatTemperature(20.4, undefined)).toBe('20°C')
  })
})
