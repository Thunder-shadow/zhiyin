export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '训练场' })
  : { navigationBarTitleText: '训练场' }
