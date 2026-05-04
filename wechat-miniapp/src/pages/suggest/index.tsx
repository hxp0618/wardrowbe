import { useState, useEffect, type ReactNode } from 'react'
import { Picker, Slider, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { actionRowStyle, getActionButtonStyle, getEnabledActionHandler } from '../../components/action-style'
import { CompactOptionGroup } from '../../components/compact-option-group'
import {
  getEditorialChipLabelStyle,
  getEditorialChipStyle,
  getEditorialPickerIconStyle,
  getEditorialPickerLabelStyle,
  getEditorialPickerTriggerStyle,
} from '../../components/editorial-style'
import { OutfitImageGrid } from '../../components/outfit-image-grid'
import { PageShell } from '../../components/page-shell'
import { cardStyle, colors } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import {
  useAcceptOutfit,
  useRejectOutfit,
  useSuggestOutfit,
  useWeather,
  useWeatherForecast,
} from '../../hooks/use-outfits'
import { usePreferences } from '../../hooks/use-preferences'
import { useUserProfile } from '../../hooks/use-user'
import {
  addDays,
  getForecastDaysForTargetDate,
  toLocalISODate,
} from '../../lib/date-utils'
import { formatItemTypeLabel, formatOccasionLabel, formatTemperature, formatWeatherConditionLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import { OCCASION_VALUES, WEATHER_CONDITION_VALUES } from '../../lib/options'

import type { Outfit, SuggestRequest } from '../../services/types'

const OCCASIONS = OCCASION_VALUES.map((value) => ({
  label: formatOccasionLabel(value),
  value,
}))

const WEATHER_CONDITION_LABELS = {
  sunny: '晴',
  cloudy: '阴',
  rainy: '雨',
} as const
const WEATHER_CONDITIONS = WEATHER_CONDITION_VALUES.map((value) => ({
  label: WEATHER_CONDITION_LABELS[value],
  value,
}))
const DATE_PRESETS = [
  { label: '今天', offset: 0 },
  { label: '明天', offset: 1 },
  { label: '3 天后', offset: 3 },
  { label: '一周后', offset: 7 },
]
const MAX_TARGET_DATE_OFFSET_DAYS = 15

function ResultBlock(props: { title: string; children: ReactNode }) {
  return (
    <View style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Text style={{ fontSize: '13px', fontWeight: 600, color: colors.textMuted }}>{props.title}</Text>
      {props.children}
    </View>
  )
}

function DatePicker(props: {
  end: string
  start: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Picker mode='date' start={props.start} end={props.end} value={props.value} onChange={(event) => props.onChange(event.detail.value)}>
      <View style={getEditorialPickerTriggerStyle()}>
        <Text style={getEditorialPickerLabelStyle()}>{props.value}</Text>
        <Text style={getEditorialPickerIconStyle()}>▾</Text>
      </View>
    </Picker>
  )
}

export default function SuggestPage() {
  const canRender = useAuthGuard()
  const { data: userProfile, isLoading: userProfileLoading } = useUserProfile()
  const { data: weather, isLoading: currentWeatherLoading } = useWeather(
    userProfile,
    !!userProfile
  )
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
  const { data: forecastData, isLoading: forecastQueryLoading } = useWeatherForecast(
    forecastDays,
    forecastDays > 0 && !!userProfile,
    userProfile
  )
  const weatherLoading = userProfileLoading || currentWeatherLoading
  const forecastLoading = forecastDays > 0 && (userProfileLoading || forecastQueryLoading)
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
    resultRecommendationTitle: '为你推荐',
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
    resultPrecipitation: (value: number) => `降水 ${value}%`,
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
  const selectedOccasionIndex = selectedOccasion
    ? occasionOptions.findIndex((option) => option.value === selectedOccasion)
    : -1
  const selectedDatePresetIndex = datePresets.findIndex(
    (preset) => toLocalISODate(addDays(new Date(), preset.offset)) === targetDate
  )
  const targetDateStart = toLocalISODate(new Date())
  const targetDateEnd = toLocalISODate(addDays(new Date(), MAX_TARGET_DATE_OFFSET_DAYS))
  const generateDisabled = !selectedOccasion || isGenerating
  const resultActionPending = suggestOutfit.isPending || acceptOutfit.isPending || rejectOutfit.isPending

  const handleGenerate = async () => {
    if (generateDisabled) return
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
    if (!outfit || resultActionPending) return
    try {
      await acceptOutfit.mutateAsync(outfit.id)
      void Taro.showToast({ title: text.accepted, icon: 'success' })
      setOutfit(null)
      setSelectedOccasion(null)
    } catch { void Taro.showToast({ title: text.actionFailed, icon: 'none' }) }
  }

  const handleReject = async () => {
    if (!outfit || resultActionPending) return
    try {
      await rejectOutfit.mutateAsync(outfit.id)
    } catch { /* ignore */ }
    setOutfit(null)
    handleGenerate()
  }
  const handleTryAnother = () => {
    if (resultActionPending) return

    setOutfit(null)
    handleGenerate()
  }

  const handleNewRequest = () => {
    setOutfit(null)
    setSelectedOccasion(null)
    setError(null)
    setTargetDate(toLocalISODate(new Date()))
    setShowWeatherOverride(false)
    setOverrideConditionIndex(-1)
    setOverrideTemp(20)
  }

  // Show request form
  return (
    <PageShell title={t('page_suggest_title')} subtitle={t('page_suggest_subtitle')} navKey='suggest' useBuiltInTabBar>
      <View
        style={{
          ...cardStyle,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {error ? (
          <View
            style={{
              padding: '2px 0 2px 10px',
              borderLeft: `3px solid ${colors.danger}`,
            }}
          >
            <Text style={{ display: 'block', fontSize: '12px', color: colors.textSoft, marginBottom: '4px' }}>{text.errorTitle}</Text>
            <Text style={{ fontSize: '13px', color: colors.danger }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text style={{ fontSize: '17px', fontWeight: 600, color: colors.text }}>
            {forecastDay ? text.targetWeatherTitle : text.currentWeatherTitle}
          </Text>
          {weatherLoading || forecastLoading ? (
            <Text style={{ fontSize: '14px', color: colors.textMuted }}>{text.weatherLoading}</Text>
          ) : weatherSummary ? (
            <View style={{ padding: '10px 0 12px', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
              <View style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                <View style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <Text style={{ fontSize: '34px', fontWeight: 700, color: colors.text }}>
                    {formatTemperature(weatherSummary.temperature, unit)}
                  </Text>
                  <Text style={{ fontSize: '13px', color: colors.textMuted }}>
                    {forecastDay
                      ? text.weatherLow(formatTemperature(weatherSummary.feels_like, unit))
                      : text.weatherFeelsLike(formatTemperature(weatherSummary.feels_like, unit))}
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
                padding: '10px 0',
                borderTop: `1px solid ${colors.border}`,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <Text style={{ fontSize: '13px', color: colors.textMuted }}>{text.weatherSkip}</Text>
            </View>
          )}
        </View>

        <View style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text style={{ fontSize: '17px', fontWeight: 600, color: colors.text }}>{text.chooseOccasion}</Text>
          <CompactOptionGroup
            activeIndex={selectedOccasionIndex}
            options={occasionOptions.map((option) => option.label)}
            onChange={(nextIndex) => setSelectedOccasion(occasionOptions[nextIndex].value)}
          />
        </View>

        <View style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text style={{ fontSize: '17px', fontWeight: 600, color: colors.text }}>{text.wearDate}</Text>
          <CompactOptionGroup
            activeIndex={selectedDatePresetIndex}
            options={datePresets.map((preset) => preset.label)}
            onChange={(nextIndex) => setTargetDate(toLocalISODate(addDays(new Date(), datePresets[nextIndex].offset)))}
          />
          <DatePicker start={targetDateStart} end={targetDateEnd} value={targetDate} onChange={setTargetDate} />
        </View>

        <View style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <View
            ariaRole='button'
            ariaLabel={text.weatherOverride}
            onClick={() => setShowWeatherOverride(!showWeatherOverride)}
            style={{
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <Text style={{ fontSize: '17px', fontWeight: 600, color: colors.text }}>{text.weatherOverride}</Text>
            <View style={{ ...getEditorialChipStyle(false), padding: '0 10px' }}>
              <Text style={{ fontSize: '12px', color: colors.textMuted }}>{showWeatherOverride ? text.collapse : text.expand}</Text>
            </View>
          </View>
          {showWeatherOverride ? (
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <CompactOptionGroup
                activeIndex={overrideConditionIndex}
                options={weatherConditionOptions.map((condition) => condition.label)}
                onChange={(nextIndex) => setOverrideConditionIndex(overrideConditionIndex === nextIndex ? -1 : nextIndex)}
              />
              {overrideConditionIndex >= 0 ? (
                <View>
                  <Text style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '8px' }}>{text.temperature(formatTemperature(overrideTemp, unit))}</Text>
                  <Slider min={-10} max={40} step={1} value={overrideTemp} onChange={(e) => setOverrideTemp(e.detail.value)} activeColor={colors.accent} backgroundColor={colors.surfaceSelected} />
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={{ fontSize: '13px', color: colors.textMuted }}>{text.weatherOverrideHint}</Text>
          )}
        </View>

        {outfit ? (
          <View style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <View style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Text style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>{text.resultHeroTitle}</Text>
              <View style={getEditorialChipStyle(true)}>
                <Text style={getEditorialChipLabelStyle(true)}>{formatOccasionLabel(outfit.occasion)}</Text>
              </View>
              {outfit.scheduled_for ? (
                <Text style={{ fontSize: '12px', color: colors.textMuted }}>{outfit.scheduled_for}</Text>
              ) : null}
              <View ariaRole='button' ariaLabel={text.restart} onClick={handleNewRequest} style={{ ...getEditorialChipStyle(false), padding: '0 10px', marginLeft: 'auto' }}>
                <Text style={{ fontSize: '12px', color: colors.textMuted }}>{text.restart}</Text>
              </View>
            </View>

            {outfit.weather ? (
              <ResultBlock title={text.resultWeatherTitle}>
                <View style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 700, color: colors.text }}>
                    {formatTemperature(outfit.weather.temperature, unit)}
                  </Text>
                  <Text style={{ fontSize: '14px', color: colors.textMuted }}>
                    {formatWeatherConditionLabel(outfit.weather.condition)} · {text.resultPrecipitation(outfit.weather.precipitation_chance)}
                  </Text>
                </View>
              </ResultBlock>
            ) : null}

            <ResultBlock title={text.resultRecommendationTitle}>
              <OutfitImageGrid
                imageAriaLabel={(label) => `查看 ${label} 大图`}
                items={outfit.items}
              />
              <View style={{ borderTop: `1px solid ${colors.border}`, marginTop: '10px' }}>
                {outfit.items.map((item) => (
                  <View key={item.id} style={{ minHeight: '38px', padding: '8px 0', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <Text style={{ flex: 1, fontSize: '13px', color: colors.text }} numberOfLines={1}>{item.name || formatItemTypeLabel(item.type)}</Text>
                    {item.layer_type ? (
                      <Text style={{ fontSize: '11px', color: colors.textSoft }}>{item.layer_type}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
              {outfit.reasoning ? (
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginTop: '2px' }}>{outfit.reasoning}</Text>
              ) : null}
              {outfit.highlights && outfit.highlights.length > 0 ? (
                <View>
                  {outfit.highlights.map((h, i) => (
                    <Text key={i} style={{ display: 'block', fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{h}</Text>
                  ))}
                </View>
              ) : null}
              {outfit.style_notes ? (
                <View style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${colors.border}` }}>
                  <Text style={{ fontSize: '13px', color: colors.textMuted }}>{outfit.style_notes}</Text>
                </View>
              ) : null}
            </ResultBlock>

            <View style={actionRowStyle}>
              <View
                ariaRole='button'
                ariaLabel={text.tryAnother}
                onClick={getEnabledActionHandler(resultActionPending, handleTryAnother)}
                style={getActionButtonStyle({ compact: true, flex: 1, disabled: resultActionPending })}
              >
                <Text style={{ fontSize: '14px', color: colors.text }}>{text.tryAnother}</Text>
              </View>
              <View
                ariaRole='button'
                ariaLabel={text.wearThis}
                onClick={getEnabledActionHandler(resultActionPending, handleAccept)}
                style={getActionButtonStyle({ variant: 'primary', compact: true, flex: 1, disabled: resultActionPending })}
              >
                <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{text.wearThis}</Text>
              </View>
              <View
                ariaRole='button'
                ariaLabel={text.reject}
                onClick={getEnabledActionHandler(resultActionPending, handleReject)}
                style={getActionButtonStyle({ compact: true, minWidth: '64px', disabled: resultActionPending })}
              >
                <Text style={{ fontSize: '14px', color: colors.textMuted }}>{text.reject}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {!outfit ? (
        <View
          ariaRole='button'
          ariaLabel={text.generate}
          onClick={getEnabledActionHandler(generateDisabled, handleGenerate)}
          style={{
            ...getActionButtonStyle({ variant: 'primary', compact: true, disabled: generateDisabled, disabledOpacity: 0.6 }),
            backgroundColor: generateDisabled ? colors.disabledSurface : colors.accent,
          }}
        >
          <Text style={{ fontSize: '16px', fontWeight: 600, color: colors.accentText }}>
            {isGenerating ? text.generating : text.generate}
          </Text>
        </View>
      ) : null}
    </PageShell>
  )
}
