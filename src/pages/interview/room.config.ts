export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '面试房间' })
  : { navigationBarTitleText: '面试房间' }
