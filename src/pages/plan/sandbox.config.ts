export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '职业规划' })
  : { navigationBarTitleText: '职业规划' }
