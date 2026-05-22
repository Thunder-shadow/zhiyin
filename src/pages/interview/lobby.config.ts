export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '训练场', navigationBarBackgroundColor: '#F8F9F7', navigationBarTextStyle: 'black' })
  : { navigationBarTitleText: '训练场', navigationBarBackgroundColor: '#F8F9F7', navigationBarTextStyle: 'black' }
