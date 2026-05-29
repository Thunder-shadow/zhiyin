# HR模拟面试功能优化 Spec

## 项目信息
- 项目路径：/root/zhiyin
- 分支：main
- 目标：优化HR模拟面试的交互体验和报告生成流程

## 需求清单

### 需求1：键盘弹起时消息自动上移
**场景**：用户点击输入框，键盘弹起时
**当前问题**：最后一条消息可能被键盘遮挡
**期望效果**：
1. 键盘弹起时，消息列表整体上移，确保最后一条消息在输入框上方
2. 发送消息后，页面整体下移回原位
3. 滚动时保持最后一条消息可见

**实现方案**：
- 监听键盘高度变化（已使用 `useKeyboardOffset` hook）
- 动态调整 ScrollView 的 paddingBottom
- 键盘弹起时，自动滚动到最新消息
- 发送消息后，延迟一下再滚动，确保消息渲染完成

### 需求2：报告生成跳转新页面
**场景**：用户点击"结束面试·查看招聘笔记"按钮
**当前问题**：直接在当前页面生成报告，用户无法退出
**期望效果**：
1. 点击按钮后，跳转到新页面（如 `/pages/hr-sim/report`）
2. 新页面显示"报告正在生成中..."的加载提示
3. 用户可以随时退出此页面
4. 报告生成完成后，显示报告内容

**实现方案**：
1. 创建新页面 `src/pages/hr-sim/report.tsx`
2. 修改 `endSimulation` 函数，跳转到新页面
3. 新页面：
   - 显示加载动画和提示文字
   - 调用后端API生成报告
   - 显示报告内容
   - 提供返回按钮

### 需求3：报告存储到数据库
**场景**：报告生成完成后
**当前问题**：报告只在前端显示，没有持久化
**期望效果**：
1. 报告生成后，存储到数据库
2. 用户可以在某个地方查看历史报告
3. 报告关联到用户和候选人

**实现方案**：
1. 后端：创建报告表 `hr_reports`
   - 字段：id, user_id, resume_index, candidate_name, report_content, created_at
2. 后端：修改报告生成API，生成后存入数据库
3. 前端：添加查看历史报告的入口（如在个人中心或HR模拟首页）

### 需求4：退出页面提醒
**场景**：用户在报告生成页面点击返回或退出
**当前问题**：用户可能不知道报告已保存
**期望效果**：
1. 弹窗提醒用户"报告正在生成中，生成后可在XXX查看"
2. 用户确认后退出

**实现方案**：
1. 使用 `Taro.showModal` 显示提醒
2. 提示内容："报告正在生成中，生成完成后可在「个人中心-招聘笔记」中查看"
3. 用户点击"确定"后退出页面

---

## 详细实现方案

### 1. 键盘弹起时消息自动上移

```typescript
// 在 hr-sim/index.tsx 中
// 已经有 keyboardOffset，需要调整 ScrollView 的样式

<ScrollView
  className="flex-1 px-4"
  style={{ 
    paddingTop: '90px',
    paddingBottom: keyboardOffset > 0 ? `${keyboardOffset + 80}px` : '160px'
  }}
  scrollY
  scrollIntoView={scrollRef.current}
  scrollWithAnimation
>
  {/* 消息列表 */}
</ScrollView>

// 发送消息后，延迟滚动
const sendMessage = async () => {
  // ... 发送逻辑
  setTimeout(() => {
    scrollToBottom()
  }, 100)
}
```

### 2. 报告生成页面

**新建文件**：`src/pages/hr-sim/report.tsx`

```tsx
import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, FileCheck, Loading } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

export default function HrReport() {
  const [step, setStep] = useState<'loading' | 'result'>('loading')
  const [hrNotes, setHrNotes] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [resumeIndex, setResumeIndex] = useState(0)
  const [conversation, setConversation] = useState([])

  useEffect(() => {
    // 从页面参数获取数据
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const params = currentPage.options || {}
    
    setCandidateName(params.candidateName || '候选人')
    setResumeIndex(parseInt(params.resumeIndex || '0'))
    
    // 从缓存获取对话记录
    const cachedConversation = Taro.getStorageSync('hr_sim_conversation')
    if (cachedConversation) {
      setConversation(cachedConversation)
      generateReport(cachedConversation)
    }
  }, [])

  const generateReport = async (conv: any[]) => {
    try {
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          action: 'hr_sim_response',
          resume_index: resumeIndex,
          end: true,
          conversation: conv
        }
      })
      
      const data = res.data?.data || res.data
      const notes = data?.hr_notes || data?.message || '报告生成失败'
      setHrNotes(notes)
      setStep('result')
      
      // 保存到数据库
      await saveReport(notes)
    } catch (err) {
      console.error('Generate report error:', err)
      setHrNotes('报告生成失败，请稍后再试')
      setStep('result')
    }
  }

  const saveReport = async (notes: string) => {
    try {
      await Network.request({
        url: '/api/hr-reports',
        method: 'POST',
        data: {
          resume_index: resumeIndex,
          candidate_name: candidateName,
          report_content: notes
        }
      })
    } catch (err) {
      console.error('Save report error:', err)
    }
  }

  const handleBack = () => {
    if (step === 'loading') {
      Taro.showModal({
        title: '提示',
        content: '报告正在生成中，生成完成后可在「个人中心-招聘笔记」中查看',
        showCancel: false,
        confirmText: '知道了'
      })
    } else {
      Taro.navigateBack()
    }
  }

  return (
    <View className="min-h-full bg-background px-4 pt-6">
      <View className="flex flex-row items-center gap-2 mb-6">
        <View onClick={handleBack} className="p-1 btn-press">
          <ArrowLeft size={20} color="#6366F1" />
        </View>
        <Text className="block text-xl font-bold text-foreground">
          {step === 'loading' ? '生成报告中...' : '招聘笔记'}
        </Text>
      </View>

      {step === 'loading' ? (
        <Card className="shadow-card">
          <CardContent className="p-8 flex flex-col items-center">
            <View className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mb-4">
              <Loading size={32} color="#8B5CF6" />
            </View>
            <Text className="block text-base font-semibold text-foreground mb-2">
              正在生成招聘笔记...
            </Text>
            <Text className="block text-sm text-muted-foreground text-center">
              AI正在分析面试对话，评估候选人表现
            </Text>
            <Text className="block text-xs text-muted-foreground mt-4">
              你可以随时退出，报告生成后会自动保存
            </Text>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="shadow-card mb-4">
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FileCheck size={16} color="#10B981" />
                </View>
                <Text className="block font-semibold text-foreground">
                  你的评估 vs 真实情况
                </Text>
              </View>
              <Text className="block text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {hrNotes}
              </Text>
            </CardContent>
          </Card>

          <View className="flex flex-col gap-3">
            <Button 
              className="w-full btn-shimmer btn-press"
              onClick={() => {
                Taro.removeStorageSync('hr_sim_conversation')
                Taro.navigateBack({ delta: 2 })
              }}
            >
              完成
            </Button>
            
            <Button 
              variant="outline"
              className="w-full btn-press"
              onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/history' })}
            >
              查看历史报告
            </Button>
          </View>
        </>
      )}
    </View>
  )
}
```

**页面配置**：`src/pages/hr-sim/report.config.ts`

```ts
export default definePageConfig({
  navigationBarTitleText: '生成报告',
})
```

### 3. 后端报告存储

**创建报告表**（如果使用数据库迁移）：

```sql
CREATE TABLE hr_reports (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  resume_index INTEGER NOT NULL,
  candidate_name VARCHAR(100) NOT NULL,
  report_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**修改后端 API**：

在 `ai.service.ts` 的 `handleHrSim` 方法中，当 `body.end === true` 时，生成报告后存入数据库：

```typescript
if (body.end) {
  // ... 生成报告逻辑
  
  // 保存到数据库
  await this.saveReport({
    userId: headers['x-user-id'] || 'anonymous',
    resumeIndex: body.resume_index,
    candidateName: selectedResume.name,
    reportContent: response.content
  })
  
  return { hr_notes: response.content }
}
```

### 4. 修改 HR 模拟面试页面

**修改 `endSimulation` 函数**：

```typescript
const endSimulation = async () => {
  // 保存对话记录到缓存
  Taro.setStorageSync('hr_sim_conversation', messages)
  
  // 跳转到报告生成页面
  Taro.navigateTo({
    url: `/pages/hr-sim/report?candidateName=${RESUME_PROFILES[resumeIndex].name}&resumeIndex=${resumeIndex}`
  })
}
```

### 5. 添加历史报告页面（可选）

**新建文件**：`src/pages/hr-sim/history.tsx`

```tsx
import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, FileCheck, Clock } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

interface Report {
  id: number
  candidate_name: string
  report_content: string
  created_at: string
}

export default function HrHistory() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const res = await Network.request({ url: '/api/hr-reports' })
      if (res.data?.code === 0) {
        setReports(res.data.data || [])
      }
    } catch (err) {
      console.error('Load reports error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-full bg-background px-4 pt-6">
      <View className="flex flex-row items-center gap-2 mb-6">
        <View onClick={() => Taro.navigateBack()} className="p-1 btn-press">
          <ArrowLeft size={20} color="#6366F1" />
        </View>
        <Text className="block text-xl font-bold text-foreground">历史报告</Text>
      </View>

      {loading ? (
        <Card className="shadow-card">
          <CardContent className="p-8 flex flex-col items-center">
            <Text className="block text-sm text-muted-foreground">加载中...</Text>
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-8 flex flex-col items-center">
            <FileCheck size={40} color="#D1D5DB" />
            <Text className="block text-sm text-muted-foreground mt-3">暂无报告</Text>
            <Text className="block text-xs text-muted-foreground mt-1">
              完成HR模拟面试后，报告会自动保存到这里
            </Text>
          </CardContent>
        </Card>
      ) : (
        <View className="flex flex-col gap-3">
          {reports.map((report) => (
            <Card key={report.id} className="shadow-card card-hover">
              <CardContent className="p-4">
                <View className="flex flex-row items-center justify-between mb-2">
                  <Text className="block font-semibold text-foreground">
                    {report.candidate_name}
                  </Text>
                  <View className="flex flex-row items-center gap-1">
                    <Clock size={12} color="#9CA3AF" />
                    <Text className="block text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text className="block text-sm text-muted-foreground line-clamp-2">
                  {report.report_content}
                </Text>
              </CardContent>
            </Card>
          ))}
        </View>
      )}
    </View>
  )
}
```

### 6. 在个人中心添加入口

在 `src/pages/profile/index.tsx` 的菜单列表中添加：

```typescript
const menuItems = [
  { label: '简历库', path: '/pages/resume/list', Icon: FileText },
  { label: '职业规划', path: '/pages/plan/sandbox', Icon: Sparkles },
  { label: '训练记录', path: '/pages/dashboard/index', Icon: Swords },
  { label: '求职笔记', path: '/pages/profile/achievements', Icon: BookOpen },
  { label: '招聘笔记', path: '/pages/hr-sim/history', Icon: FileCheck }, // 新增
  { label: '设置与帮助', path: '', Icon: Settings },
]
```

---

## 实施步骤

### 第一步：键盘弹起优化
1. 调整 ScrollView 的 paddingBottom
2. 优化 scrollToBottom 函数
3. 测试键盘弹起时消息是否自动上移

### 第二步：创建报告生成页面
1. 新建 `src/pages/hr-sim/report.tsx`
2. 新建 `src/pages/hr-sim/report.config.ts`
3. 在 `app.config.ts` 中注册页面路由

### 第三步：修改后端
1. 创建报告表（如果需要）
2. 修改 `ai.service.ts`，报告生成后存入数据库
3. 添加获取历史报告的 API

### 第四步：修改前端逻辑
1. 修改 `endSimulation` 函数，跳转到报告页面
2. 添加退出提醒逻辑

### 第五步：添加历史报告页面
1. 新建 `src/pages/hr-sim/history.tsx`
2. 在个人中心添加入口

### 第六步：测试
1. 测试键盘弹起时消息自动上移
2. 测试报告生成页面跳转
3. 测试退出提醒
4. 测试报告存储和查看

---

## 注意事项

1. **性能优化**：避免频繁的 setState
2. **用户体验**：加载状态要清晰，退出提醒要友好
3. **数据安全**：确保用户只能查看自己的报告
4. **错误处理**：网络请求失败要有兜底方案
5. **兼容性**：注意 Taro 的 API 兼容性
