import {
  TAB_NAV_ITEMS,
  toMiniappAssetPath,
  toMiniappPagePath,
} from './lib/navigation-options'

export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/dashboard/index',
    'pages/wardrobe/index',
    'pages/suggest/index',
    'pages/pairings/index',
    'pages/outfits/index',
    'pages/history/index',
    'pages/analytics/index',
    'pages/learning/index',
    'pages/family/index',
    'pages/family-feed/index',
    'pages/notifications/index',
    'pages/settings/index',
    'pages/onboarding/index',
    'pages/invite/index',
  ],
  permission: {
    'scope.userLocation': {
      desc: '用于选择当前位置并提供天气相关功能',
    },
  },
  requiredPrivateInfos: ['getLocation', 'chooseLocation'],
  tabBar: {
    color: '#8C827A',
    selectedColor: '#6F5B49',
    backgroundColor: '#FCF6ED',
    borderStyle: 'white',
    list: TAB_NAV_ITEMS.map((item) => ({
      pagePath: toMiniappPagePath(item.url),
      text: item.text,
      iconPath: toMiniappAssetPath(item.iconPath),
      selectedIconPath: toMiniappAssetPath(item.selectedIconPath),
    })),
  },
  window: {
    navigationBarTitleText: 'Wardrowbe',
    navigationStyle: 'custom',
  },
})
