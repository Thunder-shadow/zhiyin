export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '面试房间', navigationStyle: 'custom' })
  : { navigationBarTitleText: '面试房间', navigationStyle: 'custom' }
