export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '驾驶舱' })
  : { navigationBarTitleText: '驾驶舱' }
