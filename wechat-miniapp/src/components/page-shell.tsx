import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { AppHeader } from './app-header'
import { getHeaderChromeHeight, resolveHeaderMetrics } from './header-metrics'
import { MobileDrawer, resolveMobileDrawerKey } from './mobile-drawer'
import { MobileTabBar, type MobileTabKey } from './mobile-tab-bar'
import { useAuthStore } from '../stores/auth'
import { colors, getThemeStyle, pagePadding, subtitleTextStyle, titleTextStyle } from './ui-theme'

type PageShellProps = {
  title?: string
  subtitle?: string
  actions?: ReactNode
  header?: ReactNode | null
  navKey?: MobileTabKey
  useBuiltInTabBar?: boolean
  children: ReactNode
}

const DEFAULT_PAGE_SECTION_GAP = 18
const NO_HEADER_TOP_CHROME_GAP = 4

function getPageTopChromeHeight() {
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

  return getHeaderChromeHeight(
    resolveHeaderMetrics({
      statusBarHeight,
      menuButtonRect: menuButtonRect
        ? {
            top: menuButtonRect.top,
            height: menuButtonRect.height,
          }
        : undefined,
    })
  )
}

export function createPageShellHeader(
  header: ReactNode | null | undefined,
  onOpenMenu: () => void
) {
  if (header === undefined) {
    return <AppHeader onMenuClick={onOpenMenu} />
  }
  return header
}

export function resolvePageShellContentPaddingTop(
  hasHeader: boolean,
  topChromeHeight: number
) {
  if (hasHeader) {
    return `${DEFAULT_PAGE_SECTION_GAP}px`
  }

  return `${topChromeHeight + NO_HEADER_TOP_CHROME_GAP}px`
}

export function PageShell(props: PageShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [topChromeHeight, setTopChromeHeight] = useState(() => getPageTopChromeHeight())
  const appearance = useAuthStore((state) => state.appearance)
  const header = createPageShellHeader(props.header, () => setMenuOpen(true))
  const showMobileTabBar = !!props.navKey && !props.useBuiltInTabBar
  const currentPath = Taro.getCurrentInstance().router?.path
  const activeDrawerKey = resolveMobileDrawerKey(currentPath)

  useEffect(() => {
    setTopChromeHeight(getPageTopChromeHeight())
  }, [])

  return (
    <View
      style={{
        minHeight: '100vh',
        backgroundColor: colors.page,
        boxSizing: 'border-box',
        ...getThemeStyle(appearance),
      }}
    >
      {header}
      {header ? (
        <MobileDrawer
          open={menuOpen}
          activeKey={activeDrawerKey}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
      <View
        style={{
          padding: pagePadding,
          paddingTop: resolvePageShellContentPaddingTop(!!header, topChromeHeight),
          paddingBottom: props.useBuiltInTabBar || showMobileTabBar ? '104px' : '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box',
        }}
      >
        <View
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <View style={{ flex: 1 }}>
            {props.title ? <Text style={titleTextStyle}>{props.title}</Text> : null}
            {props.subtitle ? (
              <Text style={subtitleTextStyle}>{props.subtitle}</Text>
            ) : null}
          </View>
          {props.actions ? <View>{props.actions}</View> : null}
        </View>
        {props.children}
      </View>
      {showMobileTabBar ? <MobileTabBar activeKey={props.navKey!} /> : null}
    </View>
  )
}
