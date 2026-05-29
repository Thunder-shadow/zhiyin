# HR模拟面试交互修复 Spec

## 项目信息
- 项目路径：/root/zhiyin
- 分支：main
- 目标：修复头像显示问题和键盘弹起时消息滚动问题

## 问题分析

### 问题1：头像在手机端只显示一半
**原因分析**：
1. 部分头像容器没有添加 `overflow: 'hidden'`
2. 头像图标可能超出容器边界
3. 需要确保所有圆形头像容器都有正确的样式

**需要检查的页面**：
- src/pages/index/index.tsx - 部分已有，部分缺失
- src/pages/dashboard/index.tsx - 部分已有，部分缺失
- src/pages/profile/index.tsx - 部分已有，部分缺失
- src/pages/interview/lobby.tsx - 需要检查
- src/pages/resume/list.tsx - 需要检查
- src/pages/company/hall.tsx - 需要检查
- src/pages/hr-sim/index.tsx - 已有

### 问题2：键盘弹起时消息不在输入框上方
**原因分析**：
1. `useKeyboardOffset` hook 可能在小程序中没有正确工作
2. `scrollToBottom` 函数可能没有正确触发
3. ScrollView 的 paddingBottom 可能没有正确计算

**当前实现**：
```typescript
// 第375行
style={{ paddingTop: '90px', paddingBottom: keyboardOffset > 0 ? `${keyboardOffset + 80}px` : '160px' }}
```

**可能的问题**：
1. keyboardOffset 可能一直是 0
2. scrollToBottom 可能没有正确滚动到最后一条消息
3. 需要确保键盘弹起时，ScrollView 的内容区域正确调整

---

## 修复方案

### 1. 头像显示修复

**统一头像容器样式**：
```tsx
// 所有圆形头像容器都应该有这个样式
<View 
  className="w-X h-X rounded-full ... flex items justify-center"
  style={{ overflow: 'hidden' }}
>
  <Icon size={Y} color="#fff" />
</View>
```

**需要修复的位置**：

#### src/pages/index/index.tsx
- 第82行：已修复 ✅
- 其他圆形头像：检查并修复

#### src/pages/dashboard/index.tsx
- 第84行：已修复 ✅
- 第131行：需要修复（快捷入口图标）
- 第178行：需要修复（最近行动图标）

#### src/pages/profile/index.tsx
- 第79行：已修复 ✅
- 第128行：需要修复（成就图标）

#### src/pages/interview/lobby.tsx
- 检查所有圆形头像

#### src/pages/resume/list.tsx
- 检查所有圆形头像

#### src/pages/company/hall.tsx
- 检查所有圆形头像

### 2. 键盘弹起消息滚动修复

**方案A：增强 useKeyboardOffset hook**

```typescript
// src/lib/hooks/use-keyboard-offset.ts
import * as React from 'react'
import Taro from '@tarojs/taro'

let globalKeyboardHeight = 0
const listeners = new Set<(height: number) => void>()

const isNotWeb = Taro.getEnv() !== Taro.ENV_TYPE.WEB

if (isNotWeb && typeof Taro.onKeyboardHeightChange === 'function') {
  Taro.onKeyboardHeightChange(res => {
    console.log('Keyboard height changed:', res.height)
    globalKeyboardHeight = res.height
    listeners.forEach(listener => listener(globalKeyboardHeight))
  })
}

export function useKeyboardOffset() {
  const [offset, setOffset] = React.useState(globalKeyboardHeight)

  React.useEffect(() => {
    if (!isNotWeb) return

    const handler = (height: number) => {
      setOffset(height)
    }

    listeners.add(handler)
    setOffset(globalKeyboardHeight)

    return () => {
      listeners.delete(handler)
    }
  }, [])

  return offset
}
```

**方案B：修改 HR 模拟面试页面的滚动逻辑**

```typescript
// src/pages/hr-sim/index.tsx

// 1. 添加 ref 引用 ScrollView
const scrollViewRef = useRef<any>(null)

// 2. 修改 scrollToBottom 函数
const scrollToBottom = () => {
  // 使用 Taro 的 pageScrollTo 或者 ScrollView 的 scrollIntoView
  setTimeout(() => {
    Taro.pageScrollTo({
      scrollTop: 99999,
      duration: 300
    })
  }, 100)
}

// 3. 键盘弹起时的处理
useEffect(() => {
  if (keyboardOffset > 0) {
    // 键盘弹起时，延迟滚动到底部
    setTimeout(() => {
      scrollToBottom()
    }, 200)
  }
}, [keyboardOffset])

// 4. 发送消息后也要滚动
const sendMessage = async () => {
  // ... 发送逻辑
  
  // 发送后延迟滚动
  setTimeout(() => {
    scrollToBottom()
  }, 100)
}

// 5. 修改 ScrollView 的样式
<ScrollView
  ref={scrollViewRef}
  className="flex-1 px-4"
  style={{ 
    paddingTop: '90px', 
    paddingBottom: keyboardOffset > 0 ? `${keyboardOffset + 100}px` : '160px' 
  }}
  scrollY
  scrollIntoView={scrollRef.current}
  scrollWithAnimation
>
```

**方案C：使用 ScrollView 的 scrollToEnd 属性**

```typescript
// 如果 ScrollView 支持 scrollToEnd 属性
<ScrollView
  className="flex-1 px-4"
  style={{ 
    paddingTop: '90px', 
    paddingBottom: keyboardOffset > 0 ? `${keyboardOffset + 100}px` : '160px' 
  }}
  scrollY
  scrollToEnd
  scrollWithAnimation
>
```

---

## 实施步骤

### 第一步：修复头像显示
1. 搜索所有页面的圆形头像容器
2. 添加 `style={{ overflow: 'hidden' }}`
3. 测试头像显示是否正常

### 第二步：增强键盘高度检测
1. 在 useKeyboardOffset hook 中添加日志
2. 确保 hook 在小程序中正确工作
3. 测试键盘弹起时 keyboardOffset 是否正确更新

### 第三步：优化滚动逻辑
1. 修改 scrollToBottom 函数，使用 Taro.pageScrollTo
2. 键盘弹起时延迟滚动
3. 发送消息后延迟滚动
4. 调整 ScrollView 的 paddingBottom

### 第四步：测试
1. 测试头像显示是否完整
2. 测试键盘弹起时消息是否在输入框上方
3. 测试发送消息后是否自动滚动
4. 测试不同手机型号的兼容性

---

## 关键代码修改

### 1. 头像修复示例

```tsx
// 修复前
<View className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-1">
  <Text className="text-blue-500 font-bold text-xl">{stats.applied}</Text>
</View>

// 修复后
<View 
  className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-1"
  style={{ overflow: 'hidden' }}
>
  <Text className="text-blue-500 font-bold text-xl">{stats.applied}</Text>
</View>
```

### 2. 滚动逻辑修复示例

```typescript
// 修改 scrollToBottom 函数
const scrollToBottom = () => {
  // 方法1：使用 pageScrollTo
  setTimeout(() => {
    Taro.pageScrollTo({
      scrollTop: 99999,
      duration: 300
    })
  }, 100)
  
  // 方法2：使用 scrollIntoView（备选）
  scrollRef.current = 'msg-bottom-hr-' + Date.now()
}

// 键盘弹起时的处理
useEffect(() => {
  if (keyboardOffset > 0) {
    console.log('Keyboard offset:', keyboardOffset)
    setTimeout(() => {
      scrollToBottom()
    }, 300) // 增加延迟到300ms
  }
}, [keyboardOffset])

// 发送消息后的处理
const sendMessage = async () => {
  // ... 发送逻辑
  
  // 发送后延迟滚动
  setTimeout(() => {
    scrollToBottom()
  }, 200)
}
```

---

## 注意事项

1. **兼容性**：不同手机型号的键盘高度可能不同
2. **性能**：避免频繁的 setState 和滚动操作
3. **用户体验**：滚动要平滑，不要跳跃
4. **测试**：在真机上测试，模拟器可能不准确
