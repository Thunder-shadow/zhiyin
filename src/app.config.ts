export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/dashboard/index',
    'pages/company/hall',
    'pages/interview/lobby',
    'pages/profile/index',
    'pages/plan/sandbox',
    'pages/resume/list',
    'pages/resume/editor',
    'pages/company/detail',
    'pages/interview/room',
    'pages/interview/report',
    'pages/hr-sim/index',
    'pages/profile/achievements',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1A2B4C',
    navigationBarTitleText: '职引·AI求职教练',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#FF6B35',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '驾驶舱',
        iconPath: './assets/tabbar/layout-dashboard.png',
        selectedIconPath: './assets/tabbar/layout-dashboard-active.png',
      },
      {
        pagePath: 'pages/company/hall',
        text: '副本',
        iconPath: './assets/tabbar/building.png',
        selectedIconPath: './assets/tabbar/building-active.png',
      },
      {
        pagePath: 'pages/interview/lobby',
        text: '训练场',
        iconPath: './assets/tabbar/swords.png',
        selectedIconPath: './assets/tabbar/swords-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      }
    ]
  }
})
