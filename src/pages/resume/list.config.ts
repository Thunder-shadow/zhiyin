export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '简历库' })
  : { navigationBarTitleText: '简历库' }
