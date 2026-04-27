import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'

import { useUserProfile } from '../hooks/use-user'
import { useI18n } from '../lib/i18n'
import { useAuthStore } from '../stores/auth'
import { colors } from './ui-theme'
import { resolveHeaderMetrics } from './header-metrics'

type AppHeaderProps = {
  onMenuClick?: () => void
  title?: string
  hideMenu?: boolean
  hideProfileBadge?: boolean
}

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

export function getHeaderMetrics() {
  try {
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
    const metrics = resolveHeaderMetrics({
      statusBarHeight,
      menuButtonRect: menuButtonRect
        ? {
            top: menuButtonRect.top,
            height: menuButtonRect.height,
          }
        : undefined,
    })

    return {
      paddingTop: `${metrics.paddingTop}px`,
      contentHeight: `${metrics.contentHeight}px`,
      paddingBottom: `${metrics.paddingBottom}px`,
    }
  } catch {
    return {
      paddingTop: '28px',
      contentHeight: '44px',
      paddingBottom: '12px',
    }
  }
}

export function AppHeader(props: AppHeaderProps) {
  const appearance = useAuthStore((state) => state.appearance)
  const setAppearance = useAuthStore((state) => state.setAppearance)
  const { data: userProfile } = useUserProfile()
  const [metrics, setMetrics] = useState(() => getHeaderMetrics())
  const { t } = useI18n()

  useEffect(() => {
    setMetrics(getHeaderMetrics())
  }, [])

  const handleThemeTap = () => {
    const nextAppearance = appearance === 'dark' ? 'light' : 'dark'
    setAppearance(nextAppearance)
    Taro.setStorageSync('appearance', nextAppearance)
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
        paddingBottom: metrics.paddingBottom,
        backgroundColor: colors.page,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <View
        style={{
          height: metrics.contentHeight,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
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

        <View style={{ flex: 1, minWidth: '0' }}>
          {props.title ? (
            <Text
              style={{
                color: colors.text,
                fontSize: '15px',
                fontWeight: 600,
                display: 'block',
              }}
              numberOfLines={1}
            >
              {props.title}
            </Text>
          ) : null}
        </View>

        <View style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

          {!props.hideProfileBadge ? (
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
          ) : null}
        </View>
      </View>
    </View>
  )
}
