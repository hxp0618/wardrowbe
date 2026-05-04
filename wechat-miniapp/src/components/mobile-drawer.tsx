import { useEffect, useState } from 'react'

import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useI18n } from '../lib/i18n'
import { navigateToPage } from '../lib/navigation'
import {
  ALL_DRAWER_ITEMS,
  PRIMARY_DRAWER_ITEMS,
  SECONDARY_DRAWER_ITEMS,
  type AppDrawerKey,
  type AppNavItem,
} from '../lib/navigation-options'
import { colors } from './ui-theme'
import { getHeaderChromeHeight, resolveHeaderMetrics } from './header-metrics'

export type MobileDrawerKey = AppDrawerKey
const DRAWER_WIDTH = 288
const DRAWER_SIDE_PADDING = 16
const DRAWER_TOP_GAP = 4
const DRAWER_CAPSULE_GAP = 12

export function resolveMobileDrawerKey(path?: string): MobileDrawerKey | null {
  if (!path) {
    return null
  }
  const match = ALL_DRAWER_ITEMS.find((item) => item.url === path)
  return match?.key ?? null
}

export function resolveMobileDrawerLayout(
  topChromeHeight: number,
  menuButtonLeft?: number
) {
  const headerPaddingRight =
    menuButtonLeft == null
      ? 0
      : Math.max(0, DRAWER_WIDTH - menuButtonLeft + DRAWER_CAPSULE_GAP)

  return {
    paddingTop: `${topChromeHeight + DRAWER_TOP_GAP}px`,
    headerPaddingRight: `${headerPaddingRight}px`,
  }
}

function getMobileDrawerLayout() {
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
  const topChromeHeight = getHeaderChromeHeight(
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

  return resolveMobileDrawerLayout(topChromeHeight, menuButtonRect?.left)
}

type MobileDrawerProps = {
  open: boolean
  activeKey: MobileDrawerKey | null
  onClose: () => void
}

async function navigateToItem(item: AppNavItem, activeKey: MobileDrawerKey | null, onClose: () => void) {
  onClose()
  if (item.key === activeKey) {
    return
  }
  if (item.type === 'tab') {
    await Taro.switchTab({ url: item.url })
    return
  }
  navigateToPage(item.url)
}

function renderNavIcon(item: AppNavItem, active: boolean, label: string) {
  if (item.iconPath) {
    return (
      <Image
        ariaLabel={`${label} 图标`}
        mode='aspectFit'
        src={active && item.selectedIconPath ? item.selectedIconPath : item.iconPath}
        style={{
          width: '18px',
          height: '18px',
          flexShrink: 0,
          opacity: active ? 1 : 0.76,
        }}
      />
    )
  }

  return (
    <Text style={{ color: active ? colors.accentText : colors.textMuted, fontSize: '16px' }}>
      {item.iconText}
    </Text>
  )
}

function renderItem(
  item: AppNavItem,
  activeKey: MobileDrawerKey | null,
  onClose: () => void,
  label: string
) {
  const active = item.key === activeKey

  return (
    <View
      key={item.key}
      ariaRole='button'
      ariaLabel={label}
      onClick={() => {
        void navigateToItem(item, activeKey, onClose)
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minHeight: '44px',
        padding: '6px 12px',
        borderRadius: '8px',
        backgroundColor: active ? colors.accent : 'transparent',
      }}
    >
      {renderNavIcon(item, active, label)}
      <Text
        style={{
          color: active ? colors.accentText : colors.text,
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

export function MobileDrawer(props: MobileDrawerProps) {
  const { t } = useI18n()
  const [layout, setLayout] = useState(() => getMobileDrawerLayout())

  useEffect(() => {
    setLayout(getMobileDrawerLayout())
  }, [])

  useEffect(() => {
    if (!props.open) {
      return undefined
    }

    void Promise.resolve(Taro.hideTabBar({ animation: false })).catch(() => undefined)

    return () => {
      void Promise.resolve(Taro.showTabBar({ animation: false })).catch(() => undefined)
    }
  }, [props.open])

  if (!props.open) {
    return null
  }

  return (
    <View
      style={{
        pointerEvents: 'auto',
      }}
    >
      <View
        ariaRole='button'
        ariaLabel={t('drawer_dismiss')}
        catchMove
        onClick={props.onClose}
        style={{
          position: 'fixed',
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
          zIndex: 49,
          backgroundColor: 'rgba(0, 0, 0, 0.56)',
          opacity: 1,
          transition: 'opacity 180ms ease',
        }}
      />
      <View
        catchMove
        style={{
          position: 'fixed',
          top: '0',
          bottom: '0',
          left: '0',
          width: `${DRAWER_WIDTH}px`,
          zIndex: 50,
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          transform: 'translateX(0)',
          transition: 'transform 220ms ease',
          boxSizing: 'border-box',
          paddingTop: layout.paddingTop,
          paddingRight: `${DRAWER_SIDE_PADDING}px`,
          paddingBottom: '28px',
          paddingLeft: `${DRAWER_SIDE_PADDING}px`,
          maxHeight: '100vh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <View
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingRight: layout.headerPaddingRight,
          }}
        >
          <View>
            <Text style={{ display: 'block', color: colors.text, fontSize: '18px', fontWeight: 700 }}>
              Wardrowbe
            </Text>
            <Text style={{ display: 'block', marginTop: '4px', color: colors.textMuted, fontSize: '12px' }}>
              {t('drawer_title')}
            </Text>
          </View>
          <View
            ariaRole='button'
            ariaLabel={t('drawer_close')}
            onClick={props.onClose}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surfaceMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontSize: '16px' }}>×</Text>
          </View>
        </View>

        <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {PRIMARY_DRAWER_ITEMS.map((item) =>
            renderItem(item, props.activeKey, props.onClose, t(item.labelKey))
          )}
        </View>

        <View>
          <Text style={{ display: 'block', marginBottom: '8px', color: colors.textSoft, fontSize: '11px' }}>
            {t('drawer_section_settings')}
          </Text>
          <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SECONDARY_DRAWER_ITEMS.map((item) =>
              renderItem(item, props.activeKey, props.onClose, t(item.labelKey))
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
