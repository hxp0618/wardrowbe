import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useI18n } from '../lib/i18n'
import { TAB_NAV_ITEMS, type AppTabKey } from '../lib/navigation-options'
import { colors } from './ui-theme'

export type MobileTabKey = AppTabKey

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
        bottom: 'calc(12px + env(safe-area-inset-bottom))',
        zIndex: 30,
        borderRadius: '8px',
        border: `1px solid ${colors.borderStrong}`,
        backgroundColor: colors.surfaceFloating,
        display: 'flex',
        padding: '8px',
        boxSizing: 'border-box',
      }}
    >
      {TAB_NAV_ITEMS.map((item) => {
        const active = item.key === props.activeKey
        const label = t(item.labelKey)

        return (
          <View
            key={item.key}
            ariaRole='button'
            ariaLabel={label}
            onClick={() => Taro.switchTab({ url: item.url })}
            style={{
              flex: 1,
              minHeight: '44px',
              borderRadius: '8px',
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: active ? colors.surfaceRaised : 'transparent',
            }}
          >
            <Image
              ariaLabel={`${label} 图标`}
              mode='aspectFit'
              src={active ? item.selectedIconPath : item.iconPath}
              style={{
                width: '20px',
                height: '20px',
                opacity: active ? 1 : 0.72,
              }}
            />
            <Text style={{ color: active ? colors.text : colors.textSoft, fontSize: '11px' }}>
              {label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
