import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { colors } from './ui-theme'

export type MobileDrawerKey =
  | 'dashboard'
  | 'wardrobe'
  | 'suggest'
  | 'outfits'
  | 'pairings'
  | 'history'
  | 'family-feed'
  | 'analytics'
  | 'learning'
  | 'family'
  | 'notifications'
  | 'settings'

type DrawerItem = {
  key: MobileDrawerKey
  label: string
  icon: string
  url: string
  type: 'tab' | 'page'
}

const PRIMARY_ITEMS: DrawerItem[] = [
  { key: 'dashboard', label: '首页', icon: '⌂', url: '/pages/dashboard/index', type: 'tab' },
  { key: 'wardrobe', label: '衣橱', icon: '⌘', url: '/pages/wardrobe/index', type: 'tab' },
  { key: 'suggest', label: '推荐', icon: '✦', url: '/pages/suggest/index', type: 'tab' },
  { key: 'outfits', label: '穿搭', icon: '▣', url: '/pages/outfits/index', type: 'tab' },
  { key: 'pairings', label: '配对', icon: '◫', url: '/pages/pairings/index', type: 'page' },
  { key: 'history', label: '历史', icon: '↺', url: '/pages/history/index', type: 'page' },
  { key: 'family-feed', label: '家庭动态', icon: '♡', url: '/pages/family-feed/index', type: 'page' },
  { key: 'analytics', label: '分析', icon: '◔', url: '/pages/analytics/index', type: 'page' },
  { key: 'learning', label: '学习', icon: '◌', url: '/pages/learning/index', type: 'page' },
]

const SECONDARY_ITEMS: DrawerItem[] = [
  { key: 'family', label: '家庭', icon: '◍', url: '/pages/family/index', type: 'page' },
  { key: 'notifications', label: '通知', icon: '◉', url: '/pages/notifications/index', type: 'page' },
  { key: 'settings', label: '设置', icon: '⚙', url: '/pages/settings/index', type: 'tab' },
]

const ALL_ITEMS = [...PRIMARY_ITEMS, ...SECONDARY_ITEMS]

export function resolveMobileDrawerKey(path?: string): MobileDrawerKey | null {
  if (!path) {
    return null
  }
  const match = ALL_ITEMS.find((item) => item.url === path)
  return match?.key ?? null
}

type MobileDrawerProps = {
  open: boolean
  activeKey: MobileDrawerKey | null
  onClose: () => void
}

async function navigateToItem(item: DrawerItem, activeKey: MobileDrawerKey | null, onClose: () => void) {
  onClose()
  if (item.key === activeKey) {
    return
  }
  if (item.type === 'tab') {
    await Taro.switchTab({ url: item.url })
    return
  }
  await Taro.navigateTo({ url: item.url })
}

function renderItem(item: DrawerItem, activeKey: MobileDrawerKey | null, onClose: () => void) {
  const active = item.key === activeKey

  return (
    <View
      key={item.key}
      onClick={() => {
        void navigateToItem(item, activeKey, onClose)
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '14px',
        backgroundColor: active ? colors.accent : 'transparent',
      }}
    >
      <Text style={{ color: active ? colors.accentText : colors.textMuted, fontSize: '16px' }}>
        {item.icon}
      </Text>
      <Text
        style={{
          color: active ? colors.accentText : colors.text,
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        {item.label}
      </Text>
    </View>
  )
}

export function MobileDrawer(props: MobileDrawerProps) {
  return (
    <View
      style={{
        pointerEvents: props.open ? 'auto' : 'none',
      }}
    >
      <View
        onClick={props.onClose}
        style={{
          position: 'fixed',
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
          zIndex: 49,
          backgroundColor: 'rgba(0, 0, 0, 0.56)',
          opacity: props.open ? 1 : 0,
          transition: 'opacity 180ms ease',
        }}
      />
      <View
        style={{
          position: 'fixed',
          top: '0',
          bottom: '0',
          left: '0',
          width: '288px',
          zIndex: 50,
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          transform: props.open ? 'translateX(0)' : 'translateX(-110%)',
          transition: 'transform 220ms ease',
          boxSizing: 'border-box',
          padding: '24px 16px 28px',
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
          }}
        >
          <View>
            <Text style={{ display: 'block', color: colors.text, fontSize: '18px', fontWeight: 700 }}>
              Wardrowbe
            </Text>
            <Text style={{ display: 'block', marginTop: '4px', color: colors.textMuted, fontSize: '12px' }}>
              导航
            </Text>
          </View>
          <View
            onClick={props.onClose}
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
            <Text style={{ color: colors.text, fontSize: '16px' }}>×</Text>
          </View>
        </View>

        <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {PRIMARY_ITEMS.map((item) => renderItem(item, props.activeKey, props.onClose))}
        </View>

        <View>
          <Text style={{ display: 'block', marginBottom: '8px', color: colors.textSoft, fontSize: '11px' }}>
            设置与协作
          </Text>
          <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SECONDARY_ITEMS.map((item) => renderItem(item, props.activeKey, props.onClose))}
          </View>
        </View>
      </View>
    </View>
  )
}
