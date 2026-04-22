import { Button, Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo, useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { OutfitCard } from '../../components/outfit-card'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import {
  useAcceptOutfit,
  usePreferences,
  useRejectOutfit,
  useSuggestOutfit,
  useWeather,
  useWeatherForecast,
} from '../../hooks/use-outfits'
import type { Outfit } from '../../services/types'

const OCCASIONS = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor']

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function toLocalDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function diffDays(start: string, end: string): number {
  const startTime = new Date(`${start}T00:00:00`).getTime()
  const endTime = new Date(`${end}T00:00:00`).getTime()
  return Math.round((endTime - startTime) / 86400000)
}

function formatTemperature(value: number | undefined, unit: 'celsius' | 'fahrenheit' | undefined) {
  if (value == null) return '--'
  if (unit === 'fahrenheit') {
    return `${Math.round((value * 9) / 5 + 32)}°F`
  }

  return `${Math.round(value)}°C`
}

export default function SuggestPage() {
  const canRender = useAuthGuard()
  const today = useMemo(() => new Date(), [])
  const minDate = useMemo(() => toLocalDate(today), [today])
  const maxDate = useMemo(() => toLocalDate(addDays(today, 15)), [today])
  const [occasionIndex, setOccasionIndex] = useState(0)
  const [targetDate, setTargetDate] = useState(minDate)
  const [activeOutfit, setActiveOutfit] = useState<Outfit | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { data: weather } = useWeather()
  const { data: preferences } = usePreferences()
  const forecastDays = diffDays(minDate, targetDate)
  const { data: forecast } = useWeatherForecast(forecastDays, forecastDays > 0)
  const suggest = useSuggestOutfit()
  const accept = useAcceptOutfit()
  const reject = useRejectOutfit()

  if (!canRender) {
    return null
  }

  const targetForecast = forecast?.forecast?.[forecastDays - 1]

  const handleGenerate = async () => {
    try {
      setErrorMessage(null)
      const outfit = await suggest.mutateAsync({
        occasion: OCCASIONS[occasionIndex],
        target_date: targetDate,
      })
      setActiveOutfit(outfit)
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成推荐失败'
      setErrorMessage(message)
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleAccept = async () => {
    if (!activeOutfit) return
    try {
      await accept.mutateAsync(activeOutfit.id)
      setActiveOutfit(null)
      void Taro.showToast({ title: '已接受', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '接受失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleReject = async () => {
    if (!activeOutfit) return
    try {
      await reject.mutateAsync(activeOutfit.id)
      setActiveOutfit(null)
      void Taro.showToast({ title: '已拒绝', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '拒绝失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell title='推荐' subtitle='保留场景和目标日期两个核心输入，直接复用 `/outfits/suggest`、接受和拒绝接口。'>
      <SectionCard title='条件'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Picker
            mode='selector'
            range={OCCASIONS}
            value={occasionIndex}
            onChange={(event) => setOccasionIndex(Number(event.detail.value))}
          >
            <View
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5E7EB',
              }}
            >
              <Text style={{ fontSize: '22px', color: '#111827' }}>场景：{OCCASIONS[occasionIndex]}</Text>
            </View>
          </Picker>
          <Picker
            mode='date'
            start={minDate}
            end={maxDate}
            value={targetDate}
            onChange={(event) => setTargetDate(event.detail.value)}
          >
            <View
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5E7EB',
              }}
            >
              <Text style={{ fontSize: '22px', color: '#111827' }}>目标日期：{targetDate}</Text>
            </View>
          </Picker>
          <Button onClick={handleGenerate} loading={suggest.isPending}>
            生成推荐
          </Button>
        </View>
      </SectionCard>

      <SectionCard title='天气上下文'>
        {forecastDays > 0 && targetForecast ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text style={{ fontSize: '30px', fontWeight: 600, color: '#111827' }}>
              {formatTemperature(targetForecast.temp_max, preferences?.temperature_unit)}
            </Text>
            <Text style={{ fontSize: '22px', color: '#6B7280' }}>
              {targetForecast.date} · {targetForecast.condition} · 降水概率 {targetForecast.precipitation_chance}%
            </Text>
          </View>
        ) : weather ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text style={{ fontSize: '30px', fontWeight: 600, color: '#111827' }}>
              {formatTemperature(weather.temperature, preferences?.temperature_unit)}
            </Text>
            <Text style={{ fontSize: '22px', color: '#6B7280' }}>
              当前 {weather.condition} · 体感 {formatTemperature(weather.feels_like, preferences?.temperature_unit)}
            </Text>
          </View>
        ) : (
          <EmptyState title='天气暂不可用' description='如果用户未设置位置，后端会按默认逻辑继续给出推荐。' />
        )}
      </SectionCard>

      <SectionCard title='推荐结果'>
        {errorMessage ? (
          <View
            style={{
              marginBottom: '12px',
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: '#FEF2F2',
            }}
          >
            <Text style={{ fontSize: '22px', color: '#B91C1C' }}>{errorMessage}</Text>
          </View>
        ) : null}
        {activeOutfit ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <OutfitCard outfit={activeOutfit} />
            <View style={{ display: 'flex', gap: '12px' }}>
              <Button onClick={handleAccept} loading={accept.isPending}>
                接受
              </Button>
              <Button onClick={handleReject} loading={reject.isPending}>
                拒绝
              </Button>
            </View>
          </View>
        ) : (
          <EmptyState title='还没有推荐结果' description='选择场景并点一次生成，小程序会直接向后端请求一套穿搭。' />
        )}
      </SectionCard>
    </PageShell>
  )
}
