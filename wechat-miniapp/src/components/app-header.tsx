import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'

import { useUserProfile } from '../hooks/use-user'
import { useI18n } from '../lib/i18n'
import { setStoredAppearance } from '../lib/storage'
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
  const normalizedName = name?.trim()
  if (!normalizedName) return 'U'

  if (!normalizedName.includes(' ')) {
    const characters = Array.from(normalizedName)
    if (characters.some((char) => /\p{Script=Han}/u.test(char))) {
      return characters.slice(-2).join('').toUpperCase()
    }
  }

  return normalizedName
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
        windowWidth?: number
        screenWidth?: number
      }
      getAppBaseInfo?: () => {
        statusBarHeight?: number
      }
    }
    const windowInfo = taroWithWindowInfo.getWindowInfo?.() as
      | { statusBarHeight?: number; windowWidth?: number; screenWidth?: number }
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
      windowWidth: windowInfo?.windowWidth || windowInfo?.screenWidth,
      menuButtonRect: menuButtonRect
        ? {
            top: menuButtonRect.top,
            height: menuButtonRect.height,
            left: menuButtonRect.left,
            right: menuButtonRect.right,
            width: menuButtonRect.width,
          }
        : undefined,
    })

    return {
      paddingTop: `${metrics.paddingTop}px`,
      contentHeight: `${metrics.contentHeight}px`,
      paddingBottom: `${metrics.paddingBottom}px`,
      paddingRight: `${metrics.paddingRight}px`,
    }
  } catch {
    return {
      paddingTop: '28px',
      contentHeight: '44px',
      paddingBottom: '12px',
      paddingRight: '16px',
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
    setStoredAppearance(nextAppearance)
  }

  return (
    <View
      style={{
        position: 'sticky',
        top: '0',
        zIndex: 20,
        paddingTop: metrics.paddingTop,
        paddingLeft: '16px',
        paddingRight: metrics.paddingRight,
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
          ariaRole={!props.hideMenu && props.onMenuClick ? 'button' : undefined}
          ariaLabel={!props.hideMenu && props.onMenuClick ? t('app_header_open_menu') : undefined}
          onClick={props.onMenuClick}
          style={{
            width: '44px',
            height: '44px',
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
            ariaRole='button'
            ariaLabel={t('app_header_toggle_theme')}
            onClick={handleThemeTap}
            style={{
              width: '44px',
              height: '44px',
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
                {getInitials(userProfile?.display_name)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}
