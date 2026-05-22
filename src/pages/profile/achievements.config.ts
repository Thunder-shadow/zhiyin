export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '成就中心' })
  : { navigationBarTitleText: '成就中心' }
