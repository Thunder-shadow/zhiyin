export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '职引', navigationBarBackgroundColor: '#F8F9F7', navigationBarTextStyle: 'black' })
  : { navigationBarTitleText: '职引', navigationBarBackgroundColor: '#F8F9F7', navigationBarTextStyle: 'black' }
