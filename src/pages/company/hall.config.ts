export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '副本大厅' })
  : { navigationBarTitleText: '副本大厅' }
