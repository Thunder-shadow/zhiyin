export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '副本大厅', navigationBarBackgroundColor: '#F8F9F7', navigationBarTextStyle: 'black' })
  : { navigationBarTitleText: '副本大厅', navigationBarBackgroundColor: '#F8F9F7', navigationBarTextStyle: 'black' }
