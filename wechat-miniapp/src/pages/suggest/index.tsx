import { useState, useEffect } from 'react'
import { Image, Picker, Slider, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, inputStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import {
  useAcceptOutfit,
  useRejectOutfit,
  useSuggestOutfit,
  useWeather,
  useWeatherForecast,
} from '../../hooks/use-outfits'
import { usePreferences } from '../../hooks/use-preferences'
import { formatItemTypeLabel, formatOccasionLabel, formatWeatherConditionLabel } from '../../lib/display'

import type { Outfit, SuggestRequest } from '../../services/types'

const OCCASIONS = [
  { label: '休闲', value: 'casual' },
  { label: '办公', value: 'office' },
  { label: '正式', value: 'formal' },
  { label: '约会', value: 'date' },
  { label: '运动', value: 'sporty' },
  { label: '户外', value: 'outdoor' },
]

const WEATHER_CONDITIONS = [
  { label: '☀️ 晴', value: 'sunny' },
  { label: '☁️ 阴', value: 'cloudy' },
  { label: '🌧️ 雨', value: 'rainy' },
]
const DATE_PRESETS = [
  { label: '今天', offset: 0 },
  { label: '明天', offset: 1 },
  { label: '3 天后', offset: 3 },
  { label: '一周后', offset: 7 },
]

function displayTemp(celsius: number, unit: string): string {
  if (unit === 'fahrenheit') return `${Math.round(celsius * 9 / 5 + 32)}°F`
  return `${Math.round(celsius)}°C`
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toLocalISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getForecastDaysForTargetDate(targetDate: string): number {
  const today = toLocalISODate(new Date())
  if (targetDate <= today) return 0

  const current = new Date(`${today}T00:00:00`)
  const target = new Date(`${targetDate}T00:00:00`)
  const diff = Math.round((target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))

  return diff > 0 ? diff + 1 : 0
}

function getWeatherHint(options: {
  condition: string
  precipitationChance: number
  temperature: number
}) {
  if (options.precipitationChance > 50) return '今天更适合带伞或准备防水层。'
  if (options.temperature < 10) return '气温偏低，建议增加外套或针织层。'
  if (options.temperature < 18) return '偏凉，轻薄外套或叠穿会更稳妥。'
  if (options.temperature > 28) return '偏热，优先轻薄透气单品。'
  if (options.condition.toLowerCase().includes('wind')) return '风比较明显，建议考虑防风层。'
  return '天气条件平稳，可以按场景优先考虑风格。'
}

export default function SuggestPage() {
  const canRender = useAuthGuard()
  const { data: weather, isLoading: weatherLoading } = useWeather()
  const { data: prefs } = usePreferences()
  const suggestOutfit = useSuggestOutfit()
  const acceptOutfit = useAcceptOutfit()
  const rejectOutfit = useRejectOutfit()
  const unit = prefs?.temperature_unit || 'celsius'
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null)
  const [targetDate, setTargetDate] = useState(toLocalISODate(new Date()))
  const [showWeatherOverride, setShowWeatherOverride] = useState(false)
  const [overrideTemp, setOverrideTemp] = useState(20)
  const [overrideConditionIndex, setOverrideConditionIndex] = useState(-1)
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const forecastDays = getForecastDaysForTargetDate(targetDate)
  const { data: forecastData, isLoading: forecastLoading } = useWeatherForecast(
    forecastDays,
    forecastDays > 0
  )

  useEffect(() => {
    if (prefs?.default_occasion && !selectedOccasion) {
      setSelectedOccasion(prefs.default_occasion)
    }
  }, [prefs, selectedOccasion])

  if (!canRender) return null

  const isGenerating = suggestOutfit.isPending
  const forecastDay =
    forecastDays > 0 ? forecastData?.forecast?.[forecastDays - 1] : undefined
  const weatherSummary = forecastDay
    ? {
        temperature: forecastDay.temp_max,
        feels_like: forecastDay.temp_min,
        condition: forecastDay.condition,
        precipitation_chance: forecastDay.precipitation_chance,
        wind_speed: 0,
      }
    : weather
  const weatherHint = weatherSummary
    ? getWeatherHint({
        condition: weatherSummary.condition,
        precipitationChance: weatherSummary.precipitation_chance,
        temperature: weatherSummary.temperature,
      })
    : null

  const handleGenerate = async () => {
    if (!selectedOccasion) return
    setError(null)
    try {
      const request: SuggestRequest = { occasion: selectedOccasion, target_date: targetDate }
      if (overrideConditionIndex >= 0) {
        const cond = WEATHER_CONDITIONS[overrideConditionIndex].value
        request.weather_override = {
          temperature: overrideTemp,
          feels_like: overrideTemp,
          humidity: 50,
          precipitation_chance: cond === 'rainy' ? 80 : cond === 'cloudy' ? 30 : 10,
          condition: cond,
        }
      }
      const result = await suggestOutfit.mutateAsync(request)
      setOutfit(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '推荐失败')
    }
  }

  const handleAccept = async () => {
    if (!outfit) return
    try {
      await acceptOutfit.mutateAsync(outfit.id)
      void Taro.showToast({ title: '已接受', icon: 'success' })
      setOutfit(null)
      setSelectedOccasion(null)
    } catch { void Taro.showToast({ title: '操作失败', icon: 'none' }) }
  }

  const handleReject = async () => {
    if (!outfit) return
    try {
      await rejectOutfit.mutateAsync(outfit.id)
    } catch { /* ignore */ }
    setOutfit(null)
    handleGenerate()
  }

  const handleTryAnother = () => {
    setOutfit(null)
    handleGenerate()
  }

  const handleNewRequest = () => {
    setOutfit(null)
    setSelectedOccasion(null)
    setError(null)
    setTargetDate(toLocalISODate(new Date()))
  }

  // Show result
  if (outfit) {
    return (
      <PageShell title='推荐结果' navKey='suggest' useBuiltInTabBar>
        <View style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Text style={{ fontSize: '12px', color: colors.textMuted, backgroundColor: colors.surfaceMuted, padding: '4px 10px', borderRadius: '999px' }}>{formatOccasionLabel(outfit.occasion)}</Text>
          {outfit.scheduled_for && <Text style={{ fontSize: '12px', color: colors.textMuted }}>{outfit.scheduled_for}</Text>}
          <View onClick={handleNewRequest} style={{ marginLeft: 'auto' }}>
            <Text style={{ fontSize: '12px', color: colors.textMuted }}>重新开始</Text>
          </View>
        </View>

        {outfit.weather && (
          <SectionCard title='天气'>
              <Text style={{ fontSize: '14px', color: colors.textMuted }}>
              {displayTemp(outfit.weather.temperature, unit)} · {formatWeatherConditionLabel(outfit.weather.condition)} · 降水 {outfit.weather.precipitation_chance}%
            </Text>
          </SectionCard>
        )}

        <SectionCard title='✨ 为你推荐'>
          {outfit.reasoning && (
            <Text style={{ display: 'block', fontSize: '16px', fontWeight: 600, color: colors.text, marginBottom: '12px' }}>{outfit.reasoning}</Text>
          )}
          {outfit.highlights && outfit.highlights.length > 0 && (
            <View style={{ marginBottom: '12px' }}>
              {outfit.highlights.map((h, i) => (
                <Text key={i} style={{ display: 'block', fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>• {h}</Text>
              ))}
            </View>
          )}
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {outfit.items.map((item) => {
              const imgUrl = item.thumbnail_url || item.image_url
              return (
                <View key={item.id} style={{ width: '140px' }}>
                  {imgUrl ? (
                    <Image src={imgUrl} mode='aspectFill' style={{ width: '140px', height: '140px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }} />
                  ) : (
                    <View style={{ width: '140px', height: '140px', borderRadius: '14px', backgroundColor: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: '13px', color: colors.textMuted }}>{formatItemTypeLabel(item.type)}</Text>
                    </View>
                  )}
                  <Text style={{ display: 'block', fontSize: '13px', color: colors.text, marginTop: '6px' }} numberOfLines={1}>{item.name || formatItemTypeLabel(item.type)}</Text>
                  {item.layer_type && <Text style={{ fontSize: '11px', color: colors.textMuted, backgroundColor: colors.surfaceMuted, padding: '2px 8px', borderRadius: '999px' }}>{item.layer_type}</Text>}
                </View>
              )
            })}
          </View>
          {outfit.style_notes && (
            <View style={{ marginTop: '12px', padding: '10px', borderRadius: '12px', backgroundColor: colors.surfaceMuted }}>
              <Text style={{ fontSize: '13px', color: colors.textMuted }}>{outfit.style_notes}</Text>
            </View>
          )}
        </SectionCard>

        <View style={{ display: 'flex', gap: '10px' }}>
          <View onClick={handleTryAnother} style={{ ...secondaryButtonStyle, flex: 1 }}>
            <Text style={{ fontSize: '14px', color: colors.text }}>换一套</Text>
          </View>
          <View onClick={handleAccept} style={{ ...primaryButtonStyle, flex: 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>就穿它</Text>
          </View>
          <View onClick={handleReject} style={{ ...secondaryButtonStyle, minWidth: '64px' }}>
            <Text style={{ fontSize: '14px', color: colors.textMuted }}>拒绝</Text>
          </View>
        </View>
      </PageShell>
    )
  }

  // Show request form
  return (
    <PageShell title='穿搭推荐' subtitle='根据天气和场景生成今日搭配' navKey='suggest' useBuiltInTabBar>
      <SectionCard title={forecastDay ? '目标日期天气' : '当前天气'}>
        {weatherLoading || forecastLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>加载天气中...</Text>
        ) : weatherSummary ? (
          <View>
            <View style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
              <View style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <Text style={{ fontSize: '34px', fontWeight: 700, color: colors.text }}>
                  {displayTemp(weatherSummary.temperature, unit)}
                </Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted }}>
                  {forecastDay
                    ? `最低 ${displayTemp(weatherSummary.feels_like, unit)}`
                    : `体感 ${displayTemp(weatherSummary.feels_like, unit)}`}
                </Text>
              </View>
              {forecastDay ? (
                <Text style={{ fontSize: '12px', color: colors.textMuted }}>
                  {forecastDay.date}
                </Text>
              ) : null}
            </View>
            <Text style={{ display: 'block', fontSize: '13px', color: colors.textMuted }}>
              {formatWeatherConditionLabel(weatherSummary.condition)}
              {forecastDay ? '' : ` · 风速 ${Math.round(weatherSummary.wind_speed)}km/h`}
              {` · 降水 ${weatherSummary.precipitation_chance}%`}
            </Text>
            {weatherHint ? (
              <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft, marginTop: '8px', lineHeight: 1.6 }}>
                {weatherHint}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={{ fontSize: '13px', color: colors.textMuted }}>未设置位置，将跳过天气</Text>
        )}
      </SectionCard>

      {error && (
        <SectionCard title='错误'>
          <Text style={{ fontSize: '13px', color: colors.danger }}>{error}</Text>
        </SectionCard>
      )}

      <SectionCard title='选择场景'>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {OCCASIONS.map((o) => (
            <View
              key={o.value}
              onClick={() => setSelectedOccasion(o.value)}
              style={{
                padding: '10px 18px',
                borderRadius: '999px',
                border: selectedOccasion === o.value ? `2px solid ${colors.borderStrong}` : `1px solid ${colors.border}`,
                backgroundColor: selectedOccasion === o.value ? '#27272a' : colors.surfaceMuted,
              }}
            >
              <Text style={{ fontSize: '13px', color: selectedOccasion === o.value ? colors.text : colors.textMuted, fontWeight: selectedOccasion === o.value ? 600 : 400 }}>{o.label}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title='穿着日期'>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          {DATE_PRESETS.map((preset) => {
            const value = toLocalISODate(addDays(new Date(), preset.offset))
            const active = value === targetDate

            return (
              <View
                key={preset.label}
                onClick={() => setTargetDate(value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '999px',
                  border: active ? `1px solid ${colors.borderStrong}` : `1px solid ${colors.border}`,
                  backgroundColor: active ? '#27272a' : colors.surfaceMuted,
                }}
              >
                <Text style={{ fontSize: '12px', color: active ? colors.text : colors.textMuted }}>
                  {preset.label}
                </Text>
              </View>
            )
          })}
        </View>
        <Picker mode='date' value={targetDate} onChange={(e) => setTargetDate(e.detail.value)}>
          <View style={inputStyle}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{targetDate}</Text>
          </View>
        </Picker>
      </SectionCard>

      {/* Weather override */}
      <SectionCard title='天气覆盖' extra={
        <View onClick={() => setShowWeatherOverride(!showWeatherOverride)}>
          <Text style={{ fontSize: '12px', color: colors.textMuted }}>{showWeatherOverride ? '收起' : '展开'}</Text>
        </View>
      }>
        {showWeatherOverride && (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <View style={{ display: 'flex', gap: '10px' }}>
              {WEATHER_CONDITIONS.map((c, i) => (
                <View
                  key={c.value}
                  onClick={() => setOverrideConditionIndex(overrideConditionIndex === i ? -1 : i)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    border: overrideConditionIndex === i ? `2px solid ${colors.borderStrong}` : `1px solid ${colors.border}`,
                    backgroundColor: overrideConditionIndex === i ? '#27272a' : colors.surfaceMuted,
                    textAlign: 'center',
                  }}
                >
                  <Text style={{ fontSize: '13px', color: colors.text }}>{c.label}</Text>
                </View>
              ))}
            </View>
            {overrideConditionIndex >= 0 && (
              <View>
                <Text style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '8px' }}>温度：{displayTemp(overrideTemp, unit)}</Text>
                <Slider min={-10} max={40} step={1} value={overrideTemp} onChange={(e) => setOverrideTemp(e.detail.value)} activeColor='#F5F5F5' backgroundColor='#27272A' />
              </View>
            )}
          </View>
        )}
        {!showWeatherOverride && (
          <Text style={{ fontSize: '13px', color: colors.textMuted }}>手动设置天气条件（可选）</Text>
        )}
      </SectionCard>

      <View
        onClick={handleGenerate}
        style={{
          ...primaryButtonStyle,
          backgroundColor: !selectedOccasion || isGenerating ? '#71717A' : colors.accent,
          opacity: !selectedOccasion || isGenerating ? 0.6 : 1,
        }}
      >
        <Text style={{ fontSize: '16px', fontWeight: 600, color: colors.accentText }}>
          {isGenerating ? '生成中...' : '生成推荐'}
        </Text>
      </View>
    </PageShell>
  )
}
