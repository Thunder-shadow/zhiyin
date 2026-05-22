export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '我的', navigationBarBackgroundColor: '#F8F9F7', navigationBarTextStyle: 'black' })
  : { navigationBarTitleText: '我的', navigationBarBackgroundColor: '#F8F9F7', navigationBarTextStyle: 'black' }
