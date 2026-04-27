import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useI18n } from '../lib/i18n'
import { colors } from './ui-theme'

export type MobileTabKey = 'dashboard' | 'wardrobe' | 'suggest' | 'outfits' | 'settings'

const TAB_ITEMS: Array<{
  key: MobileTabKey
  labelKey: 'nav_dashboard' | 'nav_wardrobe' | 'nav_suggest' | 'nav_outfits' | 'nav_settings'
  icon: string
  url: string
}> = [
  { key: 'dashboard', labelKey: 'nav_dashboard', icon: '⌂', url: '/pages/dashboard/index' },
  { key: 'wardrobe', labelKey: 'nav_wardrobe', icon: '⌘', url: '/pages/wardrobe/index' },
  { key: 'suggest', labelKey: 'nav_suggest', icon: '✦', url: '/pages/suggest/index' },
  { key: 'outfits', labelKey: 'nav_outfits', icon: '▣', url: '/pages/outfits/index' },
  { key: 'settings', labelKey: 'nav_settings', icon: '⚙', url: '/pages/settings/index' },
]

type MobileTabBarProps = {
  activeKey: MobileTabKey
}

export function MobileTabBar(props: MobileTabBarProps) {
  const { t } = useI18n()

  return (
    <View
      style={{
        position: 'fixed',
        left: '12px',
        right: '12px',
        bottom: '12px',
        zIndex: 30,
        borderRadius: '22px',
        border: `1px solid ${colors.borderStrong}`,
        backgroundColor: colors.surfaceFloating,
        display: 'flex',
        padding: '8px',
        boxSizing: 'border-box',
        boxShadow: '0 10px 24px rgba(82, 62, 40, 0.08)',
      }}
    >
      {TAB_ITEMS.map((item) => {
        const active = item.key === props.activeKey

        return (
          <View
            key={item.key}
            onClick={() => Taro.switchTab({ url: item.url })}
            style={{
              flex: 1,
              borderRadius: '16px',
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: active ? colors.surfaceRaised : 'transparent',
            }}
          >
            <Text style={{ color: active ? colors.text : colors.textSoft, fontSize: '16px' }}>
              {item.icon}
            </Text>
            <Text style={{ color: active ? colors.text : colors.textSoft, fontSize: '11px' }}>
              {t(item.labelKey)}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
