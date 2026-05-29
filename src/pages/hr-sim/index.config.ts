export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: 'HR反向模拟', navigationStyle: 'custom' })
  : { navigationBarTitleText: 'HR反向模拟', navigationStyle: 'custom' }
