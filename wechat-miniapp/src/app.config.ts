export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/dashboard/index',
    'pages/wardrobe/index',
    'pages/suggest/index',
    'pages/pairings/index',
    'pages/outfits/index',
  ],
  tabBar: {
    color: '#6B7280',
    selectedColor: '#0F172A',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/dashboard/index', text: '首页' },
      { pagePath: 'pages/wardrobe/index', text: '衣橱' },
      { pagePath: 'pages/suggest/index', text: '推荐' },
      { pagePath: 'pages/outfits/index', text: '穿搭' },
    ],
  },
  window: {
    navigationBarTitleText: 'Wardrowbe',
    navigationStyle: 'default',
  },
})
