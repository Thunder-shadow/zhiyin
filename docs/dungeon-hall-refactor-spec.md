# 副本大厅重构 Spec - 用户创建任务 + AI面试判断Offer

## 项目信息
- 项目路径：/root/zhiyin
- 分支：main
- 目标：重构副本大厅，让用户自己创建任务，AI面试官在30轮内判断是否给Offer

## 核心需求

### 1. 用户创建任务
- 用户可以创建自己的"副本任务"（岗位）
- 需要填写：公司名称、岗位名称、薪资范围、工作地点、学历要求、行业类型
- 创建后显示在副本大厅中

### 2. 副本大厅展示
- 显示用户创建的所有任务
- 每个任务卡片显示：公司、岗位、薪资、地点、状态
- 状态包括：待挑战、面试中、已拿Offer、已失败

### 3. AI面试官聊天
- 用户点击任务卡片 → 进入AI面试聊天页面
- AI扮演该公司的面试官
- 用户是求职者，进行模拟面试
- **核心逻辑：30轮对话内判断是否给Offer**

### 4. Offer判断机制
- AI面试官需要在30轮对话内做出判断
- 判断维度：专业能力、沟通表达、逻辑思维、岗位匹配度
- 最终结果：✅ 拿到Offer / ❌ 未通过
- 结果需要保存并显示在任务状态中

---

## 页面结构

### 页面1：副本大厅 (company/hall.tsx) - 重构

**功能**：
- 显示用户创建的任务列表
- 搜索和筛选功能
- 创建新任务的入口
- 点击任务卡片进入面试

**UI结构**：
```
┌─────────────────────────────────────┐
│  🔍 搜索公司或岗位                    │
├─────────────────────────────────────┤
│  [全部] [互联网] [金融] [教育] [医疗]  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ 🏢 字节跳动                  │    │
│  │ 产品经理 · 25-40K           │    │
│  │ 📍 北京 · 本科              │    │
│  │ 状态：待挑战                 │    │
│  │ [开始面试]                   │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 🏢 腾讯                     │    │
│  │ 前端开发 · 20-35K           │    │
│  │ 📍 深圳 · 本科              │    │
│  │ 状态：已拿Offer ✅           │    │
│  │ [查看报告]                   │    │
│  └─────────────────────────────┘    │
│                                     │
│  [+ 创建新任务]  ← 底部悬浮按钮      │
└─────────────────────────────────────┘
```

**状态流转**：
- `pending` → 待挑战（初始状态）
- `interviewing` → 面试中（进入聊天后）
- `offer` → 已拿Offer（AI判断通过）
- `rejected` → 已失败（AI判断不通过）

---

### 页面2：创建任务 (company/create.tsx) - 新建

**功能**：
- 填写任务信息
- 提交创建任务

**表单字段**：
```
公司名称：[输入框] *
岗位名称：[输入框] *
薪资范围：[选择器] 5-10K / 10-15K / 15-25K / 25-40K / 40K+
工作地点：[输入框] *
学历要求：[选择器] 不限 / 大专 / 本科 / 硕士 / 博士
行业类型：[选择器] 互联网 / 金融 / 教育 / 医疗 / 制造业 / 其他
岗位描述：[文本域] （可选，帮助AI更好模拟面试）
```

**提交逻辑**：
```typescript
const createJob = async () => {
  const res = await Network.request({
    url: '/api/jobs',
    method: 'POST',
    data: {
      company: formData.company,
      position: formData.position,
      salary: formData.salary,
      location: formData.location,
      education: formData.education,
      industry: formData.industry,
      description: formData.description,
      status: 'pending'
    }
  })
  
  if (res.data?.code === 0) {
    Taro.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => Taro.navigateBack(), 1500)
  }
}
```

---

### 页面3：副本面试房间 (company/interview-room.tsx) - 新建

**功能**：
- AI扮演该公司面试官
- 用户是求职者
- 30轮对话内判断是否给Offer
- 显示面试进度（第X轮/30轮）
- 面试结束后显示结果

**UI结构**：
```
┌─────────────────────────────────────┐
│  🏢 字节跳动 · 产品经理              │
│  第 5 轮 / 30 轮                     │
├─────────────────────────────────────┤
│                                     │
│  🤖 面试官：                         │
│  你好，我是字节跳动的产品经理面试官，  │
│  请简单介绍一下你自己。               │
│                                     │
│  👤 我：                             │
│  您好，我叫张三，毕业于...            │
│                                     │
│  🤖 面试官：                         │
│  好的，请问你对产品经理这个岗位怎么   │
│  理解？                              │
│                                     │
├─────────────────────────────────────┤
│  [输入框                    ] [发送]  │
└─────────────────────────────────────┘
```

**面试结束后的结果页面**：
```
┌─────────────────────────────────────┐
│                                     │
│         🎉 恭喜通过！                │
│                                     │
│      你拿到了字节跳动的Offer！        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📊 面试评估报告               │    │
│  │                             │    │
│  │ 专业能力：⭐⭐⭐⭐☆  8/10    │    │
│  │ 沟通表达：⭐⭐⭐⭐⭐  9/10    │    │
│  │ 逻辑思维：⭐⭐⭐⭐☆  8/10    │    │
│  │ 岗位匹配：⭐⭐⭐⭐⭐  9/10    │    │
│  │                             │    │
│  │ 综合评分：8.5/10            │    │
│  │ 面试轮次：12轮               │    │
│  │                             │    │
│  │ 💬 面试官评语：               │    │
│  │ 该候选人专业能力扎实，沟通    │    │
│  │ 表达清晰，逻辑思维强，非常    │    │
│  │ 匹配产品经理岗位。           │    │
│  └─────────────────────────────┘    │
│                                     │
│  [返回副本大厅]                      │
└─────────────────────────────────────┘
```

---

## 核心逻辑：30轮Offer判断

### AI面试官System Prompt设计

```typescript
const SYSTEM_PROMPT = `你是一位{company}的{position}面试官。

## 面试规则
1. 你是专业的面试官，正在面试一位求职者
2. 面试最多进行30轮对话
3. 你需要在30轮内评估求职者是否适合这个岗位
4. 评估维度：专业能力、沟通表达、逻辑思维、岗位匹配度

## 面试流程
- 第1-5轮：自我介绍、基本情况了解
- 第6-15轮：专业能力考察（技术问题、项目经验）
- 第16-25轮：综合能力考察（情景题、压力题）
- 第26-30轮：收尾阶段，做出最终判断

## 判断标准
- 如果求职者表现优秀，在任何一轮都可以提前给出Offer
- 如果求职者表现明显不符合，可以在15轮后提前结束
- 必须在30轮内给出明确结果

## 输出格式
当你决定给出结果时，必须使用以下格式：
[OFFER_DECISION:PASS] 或 [OFFER_DECISION:FAIL]

并在后面附上评语和评分（1-10分）：
[EVALUATION]
专业能力：X/10
沟通表达：X/10
逻辑思维：X/10
岗位匹配：X/10
综合评分：X/10
[/EVALUATION]

## 注意事项
- 保持专业和友好
- 问题要有针对性，根据岗位调整
- 适时追问，深入了解求职者能力
- 不要问与岗位无关的问题`
```

### 对话轮次计数

```typescript
const [roundCount, setRoundCount] = useState(0)

const sendMessage = async () => {
  // ... 发送消息逻辑
  
  // 更新轮次
  setRoundCount(prev => prev + 1)
  
  // 检查是否超过30轮
  if (roundCount >= 30) {
    // 强制AI给出判断
    await forceDecision()
  }
}

const forceDecision = async () => {
  // 强制AI在下一轮给出判断
  const forcePrompt = `面试已达到30轮上限，请立即给出最终判断。
  
请使用以下格式输出：
[OFFER_DECISION:PASS] 或 [OFFER_DECISION:FAIL]

并附上评语和评分。`
  
  // 发送强制判断请求
}
```

### 解析AI判断结果

```typescript
const parseDecision = (content: string) => {
  // 检查是否包含OFFER_DECISION
  const passMatch = content.match(/\[OFFER_DECISION:PASS\]/)
  const failMatch = content.match(/\[OFFER_DECISION:FAIL\]/)
  
  if (passMatch) {
    return 'offer'
  } else if (failMatch) {
    return 'rejected'
  }
  
  // 解析评分
  const evalMatch = content.match(/\[EVALUATION\]([\s\S]*?)\[\/EVALUATION\]/)
  if (evalMatch) {
    const evalContent = evalMatch[1]
    const scores = {
      professional: parseInt(evalContent.match(/专业能力：(\d+)/)?.[1] || '0'),
      communication: parseInt(evalContent.match(/沟通表达：(\d+)/)?.[1] || '0'),
      logic: parseInt(evalContent.match(/逻辑思维：(\d+)/)?.[1] || '0'),
      match: parseInt(evalContent.match(/岗位匹配：(\d+)/)?.[1] || '0'),
      overall: parseInt(evalContent.match(/综合评分：(\d+)/)?.[1] || '0'),
    }
    return scores
  }
  
  return null
}
```

### 面试结束处理

```typescript
const handleInterviewEnd = async (decision: string, scores: any) => {
  // 1. 更新任务状态
  await Network.request({
    url: `/api/jobs/${jobId}`,
    method: 'PUT',
    data: {
      status: decision, // 'offer' 或 'rejected'
      scores: scores,
      interview_rounds: roundCount,
      interview_summary: summary
    }
  })
  
  // 2. 显示结果页面
  setShowResult(true)
  setInterviewResult({
    decision,
    scores,
    rounds: roundCount,
    summary
  })
}
```

---

## 后端API设计

### 1. 创建任务
```
POST /api/jobs
Request:
{
  "company": "字节跳动",
  "position": "产品经理",
  "salary": "25-40K",
  "location": "北京",
  "education": "本科",
  "industry": "互联网",
  "description": "负责产品规划和设计..."
}

Response:
{
  "code": 0,
  "data": {
    "id": "job_123",
    "status": "pending",
    "created_at": "2024-01-01"
  }
}
```

### 2. 获取任务列表
```
GET /api/jobs

Response:
{
  "code": 0,
  "data": [
    {
      "id": "job_123",
      "company": "字节跳动",
      "position": "产品经理",
      "salary": "25-40K",
      "location": "北京",
      "status": "pending",
      "scores": null
    }
  ]
}
```

### 3. 更新任务状态
```
PUT /api/jobs/:id
Request:
{
  "status": "offer",
  "scores": {
    "professional": 8,
    "communication": 9,
    "logic": 8,
    "match": 9,
    "overall": 8.5
  },
  "interview_rounds": 12,
  "interview_summary": "候选人表现优秀..."
}

Response:
{
  "code": 0,
  "message": "更新成功"
}
```

### 4. AI面试聊天
```
POST /api/ai/chat/stream
Request:
{
  "action": "interview_dungeon",
  "company": "字节跳动",
  "position": "产品经理",
  "round": 5,
  "max_rounds": 30,
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

Response:
Stream of AI responses
```

---

## 实施步骤

### 第一步：创建任务页面
1. 新建 `src/pages/company/create.tsx`
2. 实现创建任务表单
3. 调用API创建任务

### 第二步：重构副本大厅
1. 修改 `src/pages/company/hall.tsx`
2. 从API加载用户创建的任务
3. 显示任务卡片和状态
4. 点击卡片进入面试

### 第三步：副本面试房间
1. 新建 `src/pages/company/interview-room.tsx`
2. 实现AI面试聊天功能
3. 实现轮次计数
4. 实现Offer判断逻辑
5. 实现结果展示页面

### 第四步：后端API
1. 创建任务API
2. 获取任务列表API
3. 更新任务状态API
4. AI面试聊天API（复用现有）

### 第五步：测试
1. 测试创建任务流程
2. 测试副本大厅显示
3. 测试AI面试聊天
4. 测试30轮内判断Offer
5. 测试结果保存和显示

---

## 关键代码片段

### 副本面试房间核心逻辑

```typescript
export default function InterviewRoom() {
  const router = useRouter()
  const jobId = router.params.jobId
  
  const [jobInfo, setJobInfo] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [roundCount, setRoundCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [interviewResult, setInterviewResult] = useState<any>(null)
  
  const MAX_ROUNDS = 30

  useEffect(() => {
    loadJobInfo()
  }, [])

  const loadJobInfo = async () => {
    const res = await Network.request({ url: `/api/jobs/${jobId}` })
    if (res.data?.code === 0) {
      setJobInfo(res.data.data)
    }
  }

  const sendMessage = async () => {
    if (roundCount >= MAX_ROUNDS) {
      await forceDecision()
      return
    }

    // ... 发送消息逻辑
    
    setRoundCount(prev => prev + 1)
    
    // 检查AI回复是否包含判断
    const decision = parseDecision(aiResponse)
    if (decision === 'offer' || decision === 'rejected') {
      await handleInterviewEnd(decision)
    }
  }

  const forceDecision = async () => {
    // 强制AI给出判断
    const forceMessage = '面试已达到30轮上限，请立即给出最终判断。'
    // ... 发送强制判断请求
  }

  const handleInterviewEnd = async (decision: string) => {
    // 更新任务状态
    await Network.request({
      url: `/api/jobs/${jobId}`,
      method: 'PUT',
      data: {
        status: decision,
        interview_rounds: roundCount
      }
    })
    
    setShowResult(true)
    setInterviewResult({ decision, rounds: roundCount })
  }

  if (showResult) {
    return <InterviewResult result={interviewResult} jobId={jobId} />
  }

  return (
    <View>
      {/* 面试房间UI */}
    </View>
  )
}
```

### 结果展示组件

```typescript
function InterviewResult({ result, jobId }: any) {
  const isOffer = result.decision === 'offer'
  
  return (
    <View className='min-h-full bg-background'>
      <Card className='m-4 shadow-card'>
        <CardContent className='p-6 flex flex-col items-center'>
          <Text className='text-4xl mb-4'>
            {isOffer ? '🎉' : '😢'}
          </Text>
          <Text className='text-xl font-bold mb-2'>
            {isOffer ? '恭喜通过！' : '很遗憾'}
          </Text>
          <Text className='text-sm text-muted-foreground mb-6'>
            {isOffer 
              ? `你拿到了${result.company}的Offer！`
              : `这次没能通过，继续加油！`
            }
          </Text>
          
          {/* 评分卡片 */}
          <Card className='w-full bg-muted'>
            <CardContent className='p-4'>
              <Text className='font-semibold mb-3'>📊 面试评估报告</Text>
              {/* ... 评分详情 ... */}
            </CardContent>
          </Card>
          
          <Button 
            className='w-full mt-6'
            onClick={() => Taro.navigateBack()}
          >
            返回副本大厅
          </Button>
        </CardContent>
      </Card>
    </View>
  )
}
```

---

## 验证清单

- [ ] 可以创建新任务
- [ ] 创建的任务显示在副本大厅
- [ ] 任务卡片显示正确信息
- [ ] 点击卡片进入面试房间
- [ ] AI面试官正常对话
- [ ] 轮次计数正确
- [ ] 30轮内AI给出判断
- [ ] 判断结果正确保存
- [ ] 结果页面正确显示
- [ ] 任务状态正确更新
