import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { colors } from './ui-theme'

export type MobileTabKey = 'dashboard' | 'wardrobe' | 'suggest' | 'outfits' | 'settings'

const TAB_ITEMS: Array<{
  key: MobileTabKey
  label: string
  icon: string
  url: string
}> = [
  { key: 'dashboard', label: '首页', icon: '⌂', url: '/pages/dashboard/index' },
  { key: 'wardrobe', label: '衣橱', icon: '⌘', url: '/pages/wardrobe/index' },
  { key: 'suggest', label: '推荐', icon: '✦', url: '/pages/suggest/index' },
  { key: 'outfits', label: '穿搭', icon: '▣', url: '/pages/outfits/index' },
  { key: 'settings', label: '设置', icon: '⚙', url: '/pages/settings/index' },
]

type MobileTabBarProps = {
  activeKey: MobileTabKey
}

export function MobileTabBar(props: MobileTabBarProps) {
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
        backgroundColor: 'rgba(11, 11, 13, 0.96)',
        display: 'flex',
        padding: '8px',
        boxSizing: 'border-box',
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
              backgroundColor: active ? colors.surfaceMuted : 'transparent',
            }}
          >
            <Text style={{ color: active ? colors.text : colors.textSoft, fontSize: '16px' }}>
              {item.icon}
            </Text>
            <Text style={{ color: active ? colors.text : colors.textSoft, fontSize: '11px' }}>
              {item.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
