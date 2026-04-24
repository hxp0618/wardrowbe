import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useI18n } from '../lib/i18n'
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
  labelKey:
    | 'nav_dashboard'
    | 'nav_wardrobe'
    | 'nav_suggest'
    | 'nav_outfits'
    | 'nav_pairings'
    | 'nav_history'
    | 'nav_family_feed'
    | 'nav_analytics'
    | 'nav_learning'
    | 'nav_family'
    | 'nav_notifications'
    | 'nav_settings'
  icon: string
  url: string
  type: 'tab' | 'page'
}

const PRIMARY_ITEMS: DrawerItem[] = [
  { key: 'dashboard', labelKey: 'nav_dashboard', icon: '⌂', url: '/pages/dashboard/index', type: 'tab' },
  { key: 'wardrobe', labelKey: 'nav_wardrobe', icon: '⌘', url: '/pages/wardrobe/index', type: 'tab' },
  { key: 'suggest', labelKey: 'nav_suggest', icon: '✦', url: '/pages/suggest/index', type: 'tab' },
  { key: 'outfits', labelKey: 'nav_outfits', icon: '▣', url: '/pages/outfits/index', type: 'tab' },
  { key: 'pairings', labelKey: 'nav_pairings', icon: '◫', url: '/pages/pairings/index', type: 'page' },
  { key: 'history', labelKey: 'nav_history', icon: '↺', url: '/pages/history/index', type: 'page' },
  { key: 'family-feed', labelKey: 'nav_family_feed', icon: '♡', url: '/pages/family-feed/index', type: 'page' },
  { key: 'analytics', labelKey: 'nav_analytics', icon: '◔', url: '/pages/analytics/index', type: 'page' },
  { key: 'learning', labelKey: 'nav_learning', icon: '◌', url: '/pages/learning/index', type: 'page' },
]

const SECONDARY_ITEMS: DrawerItem[] = [
  { key: 'family', labelKey: 'nav_family', icon: '◍', url: '/pages/family/index', type: 'page' },
  { key: 'notifications', labelKey: 'nav_notifications', icon: '◉', url: '/pages/notifications/index', type: 'page' },
  { key: 'settings', labelKey: 'nav_settings', icon: '⚙', url: '/pages/settings/index', type: 'tab' },
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

function renderItem(
  item: DrawerItem,
  activeKey: MobileDrawerKey | null,
  onClose: () => void,
  label: string
) {
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
        {label}
      </Text>
    </View>
  )
}

export function MobileDrawer(props: MobileDrawerProps) {
  const { t } = useI18n()

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
              {t('drawer_title')}
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
          {PRIMARY_ITEMS.map((item) =>
            renderItem(item, props.activeKey, props.onClose, t(item.labelKey))
          )}
        </View>

        <View>
          <Text style={{ display: 'block', marginBottom: '8px', color: colors.textSoft, fontSize: '11px' }}>
            {t('drawer_section_settings')}
          </Text>
          <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SECONDARY_ITEMS.map((item) =>
              renderItem(item, props.activeKey, props.onClose, t(item.labelKey))
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
