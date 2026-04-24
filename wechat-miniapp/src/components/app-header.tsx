import { Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'

import { useUserProfile } from '../hooks/use-user'
import { useI18n } from '../lib/i18n'
import { useAuthStore } from '../stores/auth'
import { colors } from './ui-theme'

type AppHeaderProps = {
  onMenuClick?: () => void
  title?: string
  hideMenu?: boolean
}

const LOCALE_OPTIONS = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' },
]

function getInitials(name?: string | null): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getHeaderMetrics() {
  const taroWithWindowInfo = Taro as typeof Taro & {
    getWindowInfo?: () => {
      statusBarHeight?: number
    }
    getAppBaseInfo?: () => {
      statusBarHeight?: number
    }
  }
  const windowInfo = taroWithWindowInfo.getWindowInfo?.() as
    | { statusBarHeight?: number }
    | undefined
  const appBaseInfo = taroWithWindowInfo.getAppBaseInfo?.() as
    | { statusBarHeight?: number }
    | undefined
  const statusBarHeight =
    windowInfo?.statusBarHeight ||
    appBaseInfo?.statusBarHeight ||
    20
  const menuButtonRect = Taro.getMenuButtonBoundingClientRect?.()

  if (!menuButtonRect || !menuButtonRect.height) {
    return {
      paddingTop: `${statusBarHeight + 8}px`,
      contentHeight: '44px',
    }
  }

  const paddingTop = Math.max(menuButtonRect.top - 8, statusBarHeight + 6)

  return {
    paddingTop: `${paddingTop}px`,
    contentHeight: `${menuButtonRect.height + 10}px`,
  }
}

export function AppHeader(props: AppHeaderProps) {
  const locale = useAuthStore((state) => state.locale)
  const appearance = useAuthStore((state) => state.appearance)
  const setLocale = useAuthStore((state) => state.setLocale)
  const setAppearance = useAuthStore((state) => state.setAppearance)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const { data: userProfile } = useUserProfile()
  const [metrics, setMetrics] = useState(() => getHeaderMetrics())
  const { t } = useI18n()

  useEffect(() => {
    setMetrics(getHeaderMetrics())
  }, [])

  const localeIndex = Math.max(
    0,
    LOCALE_OPTIONS.findIndex((option) => option.value === locale)
  )

  const handleThemeTap = () => {
    const nextAppearance = appearance === 'dark' ? 'light' : 'dark'
    setAppearance(nextAppearance)
    Taro.setStorageSync('appearance', nextAppearance)
  }

  const handleLogout = () => {
    Taro.removeStorageSync('accessToken')
    setAccessToken(null)
    void Taro.redirectTo({ url: '/pages/login/index' })
  }

  return (
    <View
      style={{
        position: 'sticky',
        top: '0',
        zIndex: 20,
        paddingTop: metrics.paddingTop,
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingBottom: '12px',
        backgroundColor: colors.page,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <View
        style={{
          height: metrics.contentHeight,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <View
          onClick={props.onMenuClick}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surfaceMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: props.hideMenu ? 0 : props.onMenuClick ? 1 : 0.6,
            pointerEvents: props.hideMenu || !props.onMenuClick ? 'none' : 'auto',
          }}
        >
          <Text style={{ color: colors.text, fontSize: '18px' }}>≡</Text>
        </View>

        <View style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Picker
            mode='selector'
            range={LOCALE_OPTIONS.map((option) => option.label)}
            value={localeIndex}
            onChange={(event) => {
              const nextIndex = Number(event.detail.value)
              const nextLocale = LOCALE_OPTIONS[nextIndex]?.value
              if (nextLocale) {
                setLocale(nextLocale as 'zh' | 'en')
                Taro.setStorageSync('locale', nextLocale)
              }
            }}
          >
            <View
              style={{
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Text style={{ color: colors.text, fontSize: '12px' }}>
                {LOCALE_OPTIONS[localeIndex]?.label || '中文'}
              </Text>
            </View>
          </Picker>

          {props.title ? (
            <Text
              style={{
                color: colors.text,
                fontSize: '15px',
                fontWeight: 600,
              }}
              numberOfLines={1}
            >
              {props.title}
            </Text>
          ) : null}
        </View>

        <View style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <View
            onClick={handleThemeTap}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surfaceMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontSize: '16px' }}>
              {appearance === 'dark' ? '☾' : '☀'}
            </Text>
          </View>

          <View
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '999px',
              backgroundColor: colors.avatar,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontSize: '12px', fontWeight: 600 }}>
              {getInitials(userProfile?.display_name || t('nav_settings'))}
            </Text>
          </View>

          <View
            onClick={handleLogout}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surfaceMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontSize: '16px' }}>⇥</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
