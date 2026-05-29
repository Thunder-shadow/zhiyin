# HR模拟面试页面修复 Spec

## 项目信息
- 项目路径：/root/zhiyin
- 文件：src/pages/hr-sim/index.tsx
- 目标：修复HR模拟面试页面的多个问题

## 问题清单

### 问题1：智能体输出异常
**现象**：智能体输出时先正常输出，然后最后只显示"候选人暂时无法回复，请稍后再试..."
**可能原因**：
1. 后端返回的内容被前端替换
2. onDone回调中可能有问题
3. 错误处理逻辑有问题

**修复方案**：
1. 检查onDone回调，确保不会替换正常内容
2. 检查onError回调，确保只有在真正出错时才显示错误信息
3. 添加内容长度验证，避免空内容

### 问题2：字数限制
**需求**：AI回复最多250字
**实现**：
1. 在onChunk回调中添加字数计数
2. 当内容达到250字时，停止接收新的chunk
3. 强制结束流式输出
4. 在UI上显示字数提示

### 问题3：用户头像显示异常
**现象**：用户头像一半在外面
**可能原因**：
1. 头像容器的宽高设置问题
2. 父容器的overflow设置
3. 响应式适配问题

**修复方案**：
1. 检查头像容器的样式
2. 确保头像在容器内居中
3. 添加屏幕自适应

### 问题4：顶部和底部固定
**需求**：
- 顶部绿色框（HR模拟面试标题）始终在顶端
- 输入框始终在底部
- 中间聊天区可滚动

**实现**：
1. 使用 `position: fixed` 或 `sticky` 固定顶部
2. 使用 `position: fixed` 固定底部
3. 中间聊天区添加足够的padding，避免被顶部和底部遮挡

### 问题5：键盘弹起适配
**需求**：输入时，输入框应该在弹起的键盘上面
**实现**：
1. 使用Taro的键盘事件API
2. 监听键盘高度变化
3. 动态调整输入框位置

---

## 详细修复方案

### 1. 智能体输出修复

```typescript
// 在onChunk中添加字数限制
onChunk: (content) => {
  // 检查总字数是否超过限制
  const totalLength = aiMsg.content.length + content.length
  if (totalLength > 250) {
    // 截断到250字
    const remaining = 250 - aiMsg.content.length
    if (remaining > 0) {
      aiMsg.content += content.substring(0, remaining)
    }
    // 标记已满，不再接收
    aiMsg.streaming = false
    newMessages[newMessages.length - 1] = { ...aiMsg }
    setMessages([...newMessages])
    setIsLoading(false)
    return
  }
  
  aiMsg.content += content
  newMessages[newMessages.length - 1] = { ...aiMsg }
  setMessages([...newMessages])
  scrollToBottom()
}

// 在onDone中确保不替换内容
onDone: () => {
  // 只有当内容为空时才显示默认消息
  if (!aiMsg.content || aiMsg.content.trim() === '') {
    aiMsg.content = '候选人思考中...'
  }
  aiMsg.streaming = false
  newMessages[newMessages.length - 1] = { ...aiMsg }
  setMessages([...newMessages])
  setIsLoading(false)
}

// 在onError中显示错误
onError: () => {
  // 只有当内容为空时才显示错误
  if (!aiMsg.content || aiMsg.content.trim() === '') {
    aiMsg.content = '候选人暂时无法回复，请稍后再试...'
  }
  aiMsg.streaming = false
  newMessages[newMessages.length - 1] = { ...aiMsg }
  setMessages([...newMessages])
  setIsLoading(false)
}
```

### 2. 布局修复

```tsx
// 顶部固定
<View 
  className="px-4 pt-4 pb-3 rounded-b-2xl relative overflow-hidden"
  style={{ 
    background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100
  }}
>
  {/* 顶部内容 */}
</View>

// 中间聊天区 - 添加顶部和底部padding
<ScrollView 
  className="flex-1 px-4"
  style={{ 
    paddingTop: '80px', // 顶部高度
    paddingBottom: '80px' // 底部高度
  }}
  scrollY 
  scrollIntoView={scrollRef.current} 
  scrollWithAnimation
>
  {/* 聊天内容 */}
</ScrollView>

// 底部固定
<View 
  className="flex flex-row items-center gap-2 px-3 py-3 bg-card border-t border-outline-variant border-opacity-15"
  style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100
  }}
>
  {/* 输入框 */}
</View>
```

### 3. 键盘适配

```typescript
// 监听键盘高度
useEffect(() => {
  const keyboardHeight = 0
  
  // Taro获取键盘高度
  Taro.onKeyboardHeightChange((res) => {
    const { height } = res
    // 动态调整底部输入框位置
    const inputEl = document.querySelector('.input-container')
    if (inputEl) {
      inputEl.style.bottom = `${height}px`
    }
  })
  
  return () => {
    Taro.offKeyboardHeightChange()
  }
}, [])
```

### 4. 头像修复

```tsx
// 头像容器
<View className="relative flex-shrink-0" style={{ width: '32px', height: '32px' }}>
  <View 
    className="w-full h-full rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"
    style={{ overflow: 'hidden' }}
  >
    <Bot size={14} color="#fff" />
  </View>
</View>
```

---

## 实施步骤

### 第一步：修复智能体输出
1. 修改onChunk回调，添加字数限制
2. 修改onDone回调，确保不替换内容
3. 修改onError回调，只在内容为空时显示错误

### 第二步：修复布局
1. 固定顶部
2. 固定底部
3. 添加中间区域的padding

### 第三步：修复键盘适配
1. 监听键盘高度变化
2. 动态调整输入框位置

### 第四步：修复头像
1. 检查头像容器样式
2. 确保头像在容器内居中

### 第五步：测试
1. 测试智能体输出是否正常
2. 测试字数限制是否生效
3. 测试顶部和底部是否固定
4. 测试键盘弹起时输入框位置
5. 测试头像显示是否正常

---

## 注意事项

1. **性能优化**：避免频繁的setState
2. **兼容性**：注意Taro的API兼容性
3. **用户体验**：添加加载状态和错误提示
4. **响应式**：适配不同屏幕尺寸
