import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { EmptyState } from '../../components/empty-state'
import { OutfitCard } from '../../components/outfit-card'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { StatCard } from '../../components/stat-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useItems } from '../../hooks/use-items'
import {
  useAcceptOutfit,
  useOutfits,
  usePendingOutfits,
  usePreferences,
  useRejectOutfit,
  useWeather,
} from '../../hooks/use-outfits'
import { usePairings } from '../../hooks/use-pairings'

function openTab(url: string) {
  void Taro.switchTab({ url })
}

function openPage(url: string) {
  void Taro.navigateTo({ url })
}

function formatTemperature(value: number | undefined, unit: 'celsius' | 'fahrenheit' | undefined) {
  if (value == null) return '--'
  if (unit === 'fahrenheit') {
    return `${Math.round((value * 9) / 5 + 32)}°F`
  }

  return `${Math.round(value)}°C`
}

export default function DashboardPage() {
  const canRender = useAuthGuard()
  const { data: weather, isLoading: weatherLoading } = useWeather()
  const { data: preferences } = usePreferences()
  const { data: items } = useItems({}, 1, 1)
  const { data: outfits } = useOutfits({}, 1, 1)
  const { data: pairings } = usePairings(1, 1)
  const { data: pending } = usePendingOutfits(3)
  const accept = useAcceptOutfit()
  const reject = useRejectOutfit()

  if (!canRender) {
    return null
  }

  const handleAccept = async (outfitId: string) => {
    try {
      await accept.mutateAsync(outfitId)
      void Taro.showToast({ title: '已接受', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '接受失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleReject = async (outfitId: string) => {
    try {
      await reject.mutateAsync(outfitId)
      void Taro.showToast({ title: '已拒绝', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '拒绝失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell title='Wardrowbe' subtitle='小程序主链路已经接上后端接口，先覆盖首页、衣橱、推荐、搭配和穿搭。'>
      <SectionCard title='总览'>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <StatCard label='单品' value={String(items?.total ?? '--')} />
          <StatCard label='穿搭' value={String(outfits?.total ?? '--')} />
          <StatCard label='搭配' value={String(pairings?.total ?? '--')} />
        </View>
      </SectionCard>

      <SectionCard title='天气'>
        {weatherLoading ? (
          <Text style={{ fontSize: '22px', color: '#6B7280' }}>正在同步天气...</Text>
        ) : weather ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text style={{ fontSize: '30px', fontWeight: 600, color: '#111827' }}>
              {formatTemperature(weather.temperature, preferences?.temperature_unit)}
            </Text>
            <Text style={{ fontSize: '22px', color: '#6B7280' }}>
              体感 {formatTemperature(weather.feels_like, preferences?.temperature_unit)} · {weather.condition}
            </Text>
            <Text style={{ fontSize: '22px', color: '#6B7280' }}>
              降水概率 {weather.precipitation_chance}% · 风速 {Math.round(weather.wind_speed)} km/h
            </Text>
          </View>
        ) : (
          <EmptyState title='天气不可用' description='用户还没有配置位置，推荐页仍可直接生成穿搭。' />
        )}
      </SectionCard>

      <SectionCard title='快捷入口'>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Button onClick={() => openTab('/pages/wardrobe/index')}>去衣橱</Button>
          <Button onClick={() => openTab('/pages/suggest/index')}>去推荐</Button>
          <Button onClick={() => openPage('/pages/pairings/index')}>看搭配</Button>
          <Button onClick={() => openTab('/pages/outfits/index')}>看穿搭</Button>
        </View>
      </SectionCard>

      <SectionCard title='待处理推荐' extra={<Text style={{ fontSize: '20px', color: '#6B7280' }}>{pending?.total ?? 0} 条</Text>}>
        {pending?.outfits?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pending.outfits.map((outfit) => (
              <View key={outfit.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <OutfitCard outfit={outfit} />
                <View style={{ display: 'flex', gap: '12px' }}>
                  <Button onClick={() => handleAccept(outfit.id)} loading={accept.isPending}>
                    接受
                  </Button>
                  <Button onClick={() => handleReject(outfit.id)} loading={reject.isPending}>
                    拒绝
                  </Button>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title='当前没有待确认推荐' description='去推荐页生成一套新的穿搭，或稍后再回来查看。' />
        )}
      </SectionCard>
    </PageShell>
  )
}
