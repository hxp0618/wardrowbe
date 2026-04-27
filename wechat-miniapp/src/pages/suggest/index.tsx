import { useState, useEffect } from 'react'
import { Image, Picker, Slider, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import {
  getEditorialCardStyle,
  getEditorialChipLabelStyle,
  getEditorialChipStyle,
  getEditorialCompactButtonStyle,
  getEditorialFeatureCardStyle,
  getEditorialMetricTileStyle,
  getEditorialPickerIconStyle,
  getEditorialPickerLabelStyle,
  getEditorialPickerTriggerStyle,
  getEditorialRaisedPanelStyle,
  getEditorialTintedPanelStyle,
} from '../../components/editorial-style'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
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
import { useI18n } from '../../lib/i18n'

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

function EditorialPicker(props: {
  value: string
  mode: 'selector' | 'date'
  range?: string[]
  index?: number
  onChange: (value: string) => void
}) {
  if (props.mode === 'date') {
    return (
      <Picker mode='date' value={props.value} onChange={(event) => props.onChange(event.detail.value)}>
        <View style={getEditorialPickerTriggerStyle()}>
          <Text style={getEditorialPickerLabelStyle()}>{props.value}</Text>
          <Text style={getEditorialPickerIconStyle()}>▾</Text>
        </View>
      </Picker>
    )
  }

  return (
    <Picker
      mode='selector'
      range={props.range!}
      value={props.index}
      onChange={(event) => props.onChange(String(event.detail.value))}
    >
      <View style={getEditorialPickerTriggerStyle()}>
        <Text style={getEditorialPickerLabelStyle()}>{props.value}</Text>
        <Text style={getEditorialPickerIconStyle()}>▾</Text>
      </View>
    </Picker>
  )
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
  const { t } = useI18n()
  const occasionOptions = OCCASIONS
  const weatherConditionOptions = WEATHER_CONDITIONS
  const datePresets = DATE_PRESETS
  const text = {
    hintRain: '今天更适合带伞或准备防水层。',
    hintCold: '气温偏低，建议增加外套或针织层。',
    hintCool: '偏凉，轻薄外套或叠穿会更稳妥。',
    hintHot: '偏热，优先轻薄透气单品。',
    hintWindy: '风比较明显，建议考虑防风层。',
    hintDefault: '天气条件平稳，可以按场景优先考虑风格。',
    suggestFailed: '推荐失败',
    accepted: '已接受',
    actionFailed: '操作失败',
    restart: '重新开始',
    resultWeatherTitle: '天气',
    resultRecommendationTitle: '✨ 为你推荐',
    tryAnother: '换一套',
    wearThis: '就穿它',
    reject: '拒绝',
    targetWeatherTitle: '目标日期天气',
    currentWeatherTitle: '当前天气',
    weatherLoading: '加载天气中...',
    weatherLow: (value: string) => `最低 ${value}`,
    weatherFeelsLike: (value: string) => `体感 ${value}`,
    weatherWind: (value: number) => `风速 ${Math.round(value)}km/h`,
    weatherPrecipitation: (value: number) => `降水 ${value}%`,
    weatherSkip: '未设置位置，将跳过天气',
    errorTitle: '错误',
    chooseOccasion: '选择场景',
    wearDate: '穿着日期',
    weatherOverride: '天气覆盖',
    collapse: '收起',
    expand: '展开',
    weatherOverrideHint: '手动设置天气条件（可选）',
    temperature: (value: string) => `温度：${value}`,
    generating: '生成中...',
    generate: '生成推荐',
    resultHeroTitle: '已生成今日推荐',
    resultHeroDescription: '基于场景、天气和衣橱内容生成，可继续微调或直接接受。',
    resultPrecipitation: (value: number) => `降水 ${value}%`,
    formHeroTitle: '按天气和场景生成穿搭',
    formHeroDescription: '先选场景，再定日期，系统会结合天气和衣橱内容给你一套更贴近当天状态的推荐。',
    weatherPending: '待同步',
  }

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
    ? (() => {
        if (weatherSummary.precipitation_chance > 50) return text.hintRain
        if (weatherSummary.temperature < 10) return text.hintCold
        if (weatherSummary.temperature < 18) return text.hintCool
        if (weatherSummary.temperature > 28) return text.hintHot
        if (weatherSummary.condition.toLowerCase().includes('wind')) return text.hintWindy
        return text.hintDefault
      })()
    : null

  const handleGenerate = async () => {
    if (!selectedOccasion) return
    setError(null)
    try {
      const request: SuggestRequest = { occasion: selectedOccasion, target_date: targetDate }
      if (overrideConditionIndex >= 0) {
        const cond = weatherConditionOptions[overrideConditionIndex].value
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
      setError(err instanceof Error ? err.message : text.suggestFailed)
    }
  }

  const handleAccept = async () => {
    if (!outfit) return
    try {
      await acceptOutfit.mutateAsync(outfit.id)
      void Taro.showToast({ title: text.accepted, icon: 'success' })
      setOutfit(null)
      setSelectedOccasion(null)
    } catch { void Taro.showToast({ title: text.actionFailed, icon: 'none' }) }
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
      <PageShell title={t('page_suggest_result_title')} navKey='suggest' useBuiltInTabBar>
        <View
          style={{
            ...getEditorialFeatureCardStyle(),
            padding: '18px',
            marginBottom: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft }}>OUTFIT READY</Text>
          <Text style={{ display: 'block', marginTop: '6px', fontSize: '22px', fontWeight: 700, color: colors.text }}>
            {text.resultHeroTitle}
          </Text>
          <Text style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
            {text.resultHeroDescription}
          </Text>
          <View style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <View style={{ ...getEditorialMetricTileStyle('sand'), flex: 1, minWidth: '110px' }}>
              <Text style={{ display: 'block', fontSize: '11px', color: colors.textSoft }}>OCCASION</Text>
              <Text style={{ display: 'block', marginTop: '6px', fontSize: '15px', fontWeight: 700, color: colors.text }}>
                {formatOccasionLabel(outfit.occasion)}
              </Text>
            </View>
            <View style={{ ...getEditorialMetricTileStyle('sky'), flex: 1, minWidth: '110px' }}>
              <Text style={{ display: 'block', fontSize: '11px', color: colors.textSoft }}>DATE</Text>
              <Text style={{ display: 'block', marginTop: '6px', fontSize: '15px', fontWeight: 700, color: colors.text }}>
                {outfit.scheduled_for || targetDate}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <View style={getEditorialChipStyle(true)}>
            <Text style={getEditorialChipLabelStyle(true)}>{formatOccasionLabel(outfit.occasion)}</Text>
          </View>
          {outfit.scheduled_for && <Text style={{ fontSize: '12px', color: colors.textMuted }}>{outfit.scheduled_for}</Text>}
          <View onClick={handleNewRequest} style={{ marginLeft: 'auto' }}>
            <Text style={{ fontSize: '12px', color: colors.textMuted }}>{text.restart}</Text>
          </View>
        </View>

        {outfit.weather && (
          <SectionCard title={text.resultWeatherTitle} style={getEditorialCardStyle()}>
            <View style={{ ...getEditorialTintedPanelStyle('sky'), padding: '16px' }}>
              <Text style={{ display: 'block', fontSize: '28px', fontWeight: 700, color: colors.text }}>
                {displayTemp(outfit.weather.temperature, unit)}
              </Text>
              <Text style={{ display: 'block', marginTop: '6px', fontSize: '14px', color: colors.textMuted }}>
                {formatWeatherConditionLabel(outfit.weather.condition)} · {text.resultPrecipitation(outfit.weather.precipitation_chance)}
              </Text>
            </View>
          </SectionCard>
        )}

        <SectionCard title={text.resultRecommendationTitle} style={getEditorialRaisedPanelStyle()}>
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
                <View key={item.id} style={{ width: '140px', ...getEditorialCardStyle(), padding: '10px' }}>
                  {imgUrl ? (
                    <Image src={imgUrl} mode='aspectFill' style={{ width: '120px', height: '132px', borderRadius: '16px', backgroundColor: colors.surfaceMuted }} />
                  ) : (
                    <View style={{ width: '120px', height: '132px', borderRadius: '16px', backgroundColor: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: '13px', color: colors.textMuted }}>{formatItemTypeLabel(item.type)}</Text>
                    </View>
                  )}
                  <Text style={{ display: 'block', fontSize: '13px', color: colors.text, marginTop: '6px' }} numberOfLines={1}>{item.name || formatItemTypeLabel(item.type)}</Text>
                  {item.layer_type && <Text style={{ fontSize: '11px', color: colors.textMuted, backgroundColor: colors.surfaceMuted, padding: '2px 8px', borderRadius: '999px', marginTop: '4px', display: 'inline-flex' }}>{item.layer_type}</Text>}
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
          <View onClick={handleTryAnother} style={{ ...secondaryButtonStyle, ...getEditorialCompactButtonStyle(), flex: 1 }}>
            <Text style={{ fontSize: '14px', color: colors.text }}>{text.tryAnother}</Text>
          </View>
          <View onClick={handleAccept} style={{ ...primaryButtonStyle, ...getEditorialCompactButtonStyle(), flex: 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{text.wearThis}</Text>
          </View>
          <View onClick={handleReject} style={{ ...secondaryButtonStyle, ...getEditorialCompactButtonStyle(), minWidth: '64px' }}>
            <Text style={{ fontSize: '14px', color: colors.textMuted }}>{text.reject}</Text>
          </View>
        </View>
      </PageShell>
    )
  }

  // Show request form
  return (
    <PageShell title={t('page_suggest_title')} subtitle={t('page_suggest_subtitle')} navKey='suggest' useBuiltInTabBar>
      <View
        style={{
          ...getEditorialFeatureCardStyle(),
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <View>
          <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft }}>STYLE STUDIO</Text>
          <Text style={{ display: 'block', marginTop: '6px', fontSize: '22px', fontWeight: 700, color: colors.text }}>
            {text.formHeroTitle}
          </Text>
          <Text style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
            {text.formHeroDescription}
          </Text>
        </View>
        <View style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <View
            style={{
              ...getEditorialMetricTileStyle('sand'),
              flex: 1,
              minWidth: '110px',
              border: 'none',
              borderRadius: '0',
            }}
          >
            <Text style={{ display: 'block', fontSize: '11px', color: colors.textSoft }}>OCCASION</Text>
            <Text style={{ display: 'block', marginTop: '6px', fontSize: '15px', fontWeight: 700, color: colors.text }}>
              {selectedOccasion ? formatOccasionLabel(selectedOccasion) : text.chooseOccasion}
            </Text>
          </View>
          <View
            style={{
              ...getEditorialMetricTileStyle('sky'),
              flex: 1,
              minWidth: '110px',
              border: 'none',
              borderRadius: '0',
            }}
          >
            <Text style={{ display: 'block', fontSize: '11px', color: colors.textSoft }}>DATE</Text>
            <Text style={{ display: 'block', marginTop: '6px', fontSize: '15px', fontWeight: 700, color: colors.text }}>
              {targetDate}
            </Text>
          </View>
          <View
            style={{
              ...getEditorialMetricTileStyle('sage'),
              flex: 1,
              minWidth: '110px',
              border: 'none',
              borderRadius: '0',
            }}
          >
            <Text style={{ display: 'block', fontSize: '11px', color: colors.textSoft }}>WEATHER</Text>
            <Text style={{ display: 'block', marginTop: '6px', fontSize: '15px', fontWeight: 700, color: colors.text }}>
              {weatherSummary ? formatWeatherConditionLabel(weatherSummary.condition) : text.weatherPending}
            </Text>
          </View>
        </View>
      </View>

      <SectionCard title={forecastDay ? text.targetWeatherTitle : text.currentWeatherTitle} style={getEditorialCardStyle()}>
        {weatherLoading || forecastLoading ? (
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{text.weatherLoading}</Text>
        ) : weatherSummary ? (
          <View style={{ ...getEditorialTintedPanelStyle('sky'), padding: '16px' }}>
            <View style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
              <View style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <Text style={{ fontSize: '34px', fontWeight: 700, color: colors.text }}>
                  {displayTemp(weatherSummary.temperature, unit)}
                </Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted }}>
                  {forecastDay
                    ? text.weatherLow(displayTemp(weatherSummary.feels_like, unit))
                    : text.weatherFeelsLike(displayTemp(weatherSummary.feels_like, unit))}
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
              {forecastDay ? '' : ` · ${text.weatherWind(weatherSummary.wind_speed)}`}
              {` · ${text.weatherPrecipitation(weatherSummary.precipitation_chance)}`}
            </Text>
            {weatherHint ? (
              <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft, marginTop: '8px', lineHeight: 1.6 }}>
                {weatherHint}
              </Text>
            ) : null}
          </View>
        ) : (
          <View
            style={{
              ...getEditorialTintedPanelStyle('rose'),
              padding: '16px',
              border: 'none',
              borderRadius: '0',
            }}
          >
            <Text style={{ fontSize: '13px', color: colors.textMuted }}>{text.weatherSkip}</Text>
          </View>
        )}
      </SectionCard>

      {error && (
        <SectionCard title={text.errorTitle} style={getEditorialCardStyle()}>
          <Text style={{ fontSize: '13px', color: colors.danger }}>{error}</Text>
        </SectionCard>
      )}

      <SectionCard title={text.chooseOccasion} style={getEditorialRaisedPanelStyle()}>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {occasionOptions.map((o) => (
            <View
              key={o.value}
              onClick={() => setSelectedOccasion(o.value)}
              style={getEditorialChipStyle(selectedOccasion === o.value)}
            >
              <Text style={getEditorialChipLabelStyle(selectedOccasion === o.value)}>{o.label}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title={text.wearDate} style={getEditorialCardStyle()}>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          {datePresets.map((preset) => {
            const value = toLocalISODate(addDays(new Date(), preset.offset))
            const active = value === targetDate

            return (
              <View
                key={preset.label}
                onClick={() => setTargetDate(value)}
                style={getEditorialChipStyle(active)}
              >
                <Text style={getEditorialChipLabelStyle(active)}>{preset.label}</Text>
              </View>
            )
          })}
        </View>
        <EditorialPicker mode='date' value={targetDate} onChange={setTargetDate} />
      </SectionCard>

      {/* Weather override */}
      <SectionCard title={text.weatherOverride} style={getEditorialCardStyle()} extra={
        <View onClick={() => setShowWeatherOverride(!showWeatherOverride)}>
          <Text style={{ fontSize: '12px', color: colors.textMuted }}>{showWeatherOverride ? text.collapse : text.expand}</Text>
        </View>
      }>
        {showWeatherOverride && (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <View style={{ display: 'flex', gap: '10px' }}>
              {weatherConditionOptions.map((c, i) => (
                <View
                  key={c.value}
                  onClick={() => setOverrideConditionIndex(overrideConditionIndex === i ? -1 : i)}
                  style={{ flex: 1, ...getEditorialChipStyle(overrideConditionIndex === i) }}
                >
                  <Text style={getEditorialChipLabelStyle(overrideConditionIndex === i)}>{c.label}</Text>
                </View>
              ))}
            </View>
            {overrideConditionIndex >= 0 && (
              <View>
                <Text style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '8px' }}>{text.temperature(displayTemp(overrideTemp, unit))}</Text>
                <Slider min={-10} max={40} step={1} value={overrideTemp} onChange={(e) => setOverrideTemp(e.detail.value)} activeColor={colors.accent} backgroundColor={colors.surfaceSelected} />
              </View>
            )}
          </View>
        )}
        {!showWeatherOverride && (
          <Text style={{ fontSize: '13px', color: colors.textMuted }}>{text.weatherOverrideHint}</Text>
        )}
      </SectionCard>

      <View
        onClick={handleGenerate}
        style={{
          ...primaryButtonStyle,
          ...getEditorialCompactButtonStyle(),
          backgroundColor: !selectedOccasion || isGenerating ? colors.disabledSurface : colors.accent,
          opacity: !selectedOccasion || isGenerating ? 0.6 : 1,
        }}
      >
        <Text style={{ fontSize: '16px', fontWeight: 600, color: colors.accentText }}>
          {isGenerating ? text.generating : text.generate}
        </Text>
      </View>
    </PageShell>
  )
}
