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
    color: '#71717A',
    selectedColor: '#F5F5F5',
    backgroundColor: '#0B0B0D',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/dashboard/index', text: '首页' },
      { pagePath: 'pages/wardrobe/index', text: '衣橱' },
      { pagePath: 'pages/suggest/index', text: '推荐' },
      { pagePath: 'pages/outfits/index', text: '穿搭' },
      { pagePath: 'pages/settings/index', text: '设置' },
    ],
  },
  window: {
    navigationBarTitleText: 'Wardrowbe',
    navigationStyle: 'custom',
  },
})
