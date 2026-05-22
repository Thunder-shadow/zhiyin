export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '面试报告' })
  : { navigationBarTitleText: '面试报告' }
