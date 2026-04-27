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
    list: [
      {
        pagePath: 'pages/dashboard/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png',
      },
      {
        pagePath: 'pages/wardrobe/index',
        text: '衣橱',
        iconPath: 'assets/tabbar/wardrobe.png',
        selectedIconPath: 'assets/tabbar/wardrobe-active.png',
      },
      {
        pagePath: 'pages/suggest/index',
        text: '推荐',
        iconPath: 'assets/tabbar/suggest.png',
        selectedIconPath: 'assets/tabbar/suggest-active.png',
      },
      {
        pagePath: 'pages/outfits/index',
        text: '穿搭',
        iconPath: 'assets/tabbar/outfits.png',
        selectedIconPath: 'assets/tabbar/outfits-active.png',
      },
      {
        pagePath: 'pages/settings/index',
        text: '设置',
        iconPath: 'assets/tabbar/settings.png',
        selectedIconPath: 'assets/tabbar/settings-active.png',
      },
    ],
  },
  window: {
    navigationBarTitleText: 'Wardrowbe',
    navigationStyle: 'custom',
  },
})
