export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '公司详情' })
  : { navigationBarTitleText: '公司详情' }
