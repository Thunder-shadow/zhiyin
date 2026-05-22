export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '编辑简历' })
  : { navigationBarTitleText: '编辑简历' }
