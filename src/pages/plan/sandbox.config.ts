export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '职业规划', navigationStyle: 'custom' })
  : { navigationBarTitleText: '职业规划', navigationStyle: 'custom' }
