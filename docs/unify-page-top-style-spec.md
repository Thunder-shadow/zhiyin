# 统一页面顶部为纯展示样式 Spec

## 项目信息
- 项目路径：/root/zhiyin
- 分支：main
- 目标：将所有页面顶部统一为纯展示样式，移除所有功能按钮

## 问题背景

小程序中，页面顶部的自定义按钮（ArrowLeft返回、新建、保存等）会和微信原生导航栏组件冲突，导致按键堆叠。

### 解决方案
1. **移除所有页面顶部的功能按钮**（返回按钮、新建按钮等）
2. **返回功能由微信小程序原生导航栏处理**（无需代码实现）
3. **功能按钮移到页面主体区域**（如卡片内、底部等）
4. **顶部统一为纯展示样式**，参考首页 (index/index.tsx) 的用户概览卡片

## 首页参考样式

首页顶部是纯展示的用户概览卡片：
```tsx
<View className='px-4 pt-3'>
  <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
    {/* 渐变顶部装饰条 */}
    <View className='h-2' style={{ background: 'linear-gradient(90deg, #3A4A44, #5B9A6F, #D4A574)' }} />
    <CardContent className='p-4'>
      <View className='flex flex-row items-center gap-3'>
        {/* 头像带光环 */}
        <View className='relative flex-shrink-0'>
          <View className='absolute inset-0 rounded-full' style={{ background: 'linear-gradient(135deg, #5B9A6F, #D4A574)', padding: '2px', margin: '-2px' }} />
          <View className='w-12 h-12 rounded-full bg-primary flex items-center justify-center relative' style={{ overflow: 'hidden' }}>
            <Text className='text-lg font-bold text-primary-foreground'>{gameState.title[0]}</Text>
          </View>
        </View>
        {/* 中间信息 */}
        <View className='flex-1 min-w-0'>
          <View className='flex flex-row items-center gap-2'>
            <Text className='text-base font-semibold text-foreground'>小初</Text>
            <View className='px-2 py-1 rounded-full bg-primary-container'>
              <Text className='text-xs font-bold text-primary'>Lv.{gameState.level}</Text>
            </View>
          </View>
          <Text className='block text-sm text-muted-foreground mt-1'>称号：{gameState.title}</Text>
          {/* 经验进度条 */}
          <View className='flex flex-row items-center gap-2 mt-2'>
            <View className='flex-1 h-2 bg-muted rounded-full overflow-hidden'>
              <View
                className='h-full rounded-full progress-animated'
                style={{ width: `${expPercent}%`, background: 'linear-gradient(90deg, #3A4A44, #5B9A6F)' }}
              />
            </View>
            <Text className='text-xs text-muted-foreground whitespace-nowrap'>{gameState.exp}/{gameState.exp_to_next} EXP</Text>
          </View>
        </View>
        {/* 右侧连续活跃徽章 */}
        {gameState.streak > 0 && (
          <View className='flex-shrink-0 flex flex-col items-center gap-1'>
            <View className='flex flex-row items-center px-3 py-1 rounded-lg bg-warning bg-opacity-20 badge-glow'>
              <Flame size={14} color='#D4A574' />
              <Text className='text-xs font-semibold text-warning ml-1'>{gameState.streak}天</Text>
            </View>
            <Text className='text-xs text-muted-foreground' style={{ fontSize: '10px' }}>连续活跃</Text>
          </View>
        )}
      </View>
    </CardContent>
  </Card>
</View>
```

**关键特点**：
- 没有任何功能按钮（无ArrowLeft、无onClick跳转）
- 纯展示信息：头像、等级、称号、进度条
- 渐变装饰条
- 入场动画 `anim-fade-in-up`

---

## 需要修改的页面

### 1. 简历库 - src/pages/resume/list.tsx

**当前问题**：
- 顶部有 ArrowLeft 返回按钮（第45-46行）
- 顶部有 "新建" 按钮（第52-59行）

**修改方案**：
```tsx
// 修改前
<View className='px-4 pt-4 pb-6 rounded-b-3xl relative overflow-hidden'
  style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 50%, #52B788 100%)' }}>
  {/* 背景装饰 */}
  <View className='absolute -top-6 -right-6 w-24 h-24 rounded-full' style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
  <View className='absolute bottom-2 left-8 w-16 h-16 rounded-full' style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />

  <View className='flex flex-row items-center gap-2 mb-2 relative'>
    <View onClick={() => Taro.navigateBack()} className='p-1 btn-press'>
      <ArrowLeft size={20} color='#fff' />
    </View>
    <View className='flex-1'>
      <Text className='block text-white font-bold text-lg'>简历库</Text>
      <Text className='block text-emerald-200 text-xs mt-1'>管理你的简历，AI优化匹配</Text>
    </View>
    <Button
      size='sm'
      className='bg-white border-none rounded-lg btn-press'
      style={{ color: '#2D6A4F' }}
      onClick={() => Taro.navigateTo({ url: '/pages/resume/editor?mode=add' })}
    >
      <Plus size={14} color='#2D6A4F' />
      <Text className='ml-1 font-semibold' style={{ color: '#2D6A4F' }}>新建</Text>
    </Button>
  </View>
</View>

// 修改后 - 纯展示样式
<View className='px-4 pt-3'>
  <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
    <View className='h-2' style={{ background: 'linear-gradient(90deg, #2D6A4F, #40916C, #52B788)' }} />
    <CardContent className='p-4'>
      <View className='flex flex-row items-center gap-3'>
        <View className='w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0'>
          <FileText size={22} color='#10B981' />
        </View>
        <View className='flex-1 min-w-0'>
          <Text className='text-base font-semibold text-foreground'>简历库</Text>
          <Text className='text-xs text-muted-foreground mt-1'>管理你的简历，AI优化匹配</Text>
        </View>
        <Badge variant='secondary' className='flex-shrink-0'>
          {resumes.length}份
        </Badge>
      </View>
    </CardContent>
  </Card>
</View>

// "新建"按钮移到页面主体区域（简历列表上方或底部）
<View className='px-4 mt-4'>
  <Button 
    className='w-full btn-shimmer' 
    onClick={() => Taro.navigateTo({ url: '/pages/resume/editor?mode=add' })}
  >
    <Plus size={16} />
    <Text className='ml-2'>新建简历</Text>
  </Button>
</View>
```

---

### 2. HR模拟 - src/pages/hr-sim/index.tsx

**当前问题**：
- 顶部有 ArrowLeft 返回按钮（第237-238行）
- 面试模式选择页面有返回按钮（第327行）

**修改方案**：
```tsx
// 修改前
<View className='flex flex-row items-center gap-2 mb-2'>
  <View onClick={() => Taro.navigateBack()} className='p-1 btn-press'>
    <ArrowLeft size={20} color='#fff' />
  </View>
  <View className='flex-1'>
    <Text className='block text-white font-bold text-lg'>HR反向模拟</Text>
    <Text className='block text-violet-200 text-xs mt-1'>扮演HR面试候选人，训练选人眼光</Text>
  </View>
</View>

// 修改后 - 纯展示样式
<View className='px-4 pt-3'>
  <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
    <View className='h-2' style={{ background: 'linear-gradient(90deg, #7C3AED, #4F46E5, #6366F1)' }} />
    <CardContent className='p-4'>
      <View className='flex flex-row items-center gap-3'>
        <View className='w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0'>
          <LayoutDashboard size={22} color='#7C5CFC' />
        </View>
        <View className='flex-1 min-w-0'>
          <Text className='text-base font-semibold text-foreground'>HR反向模拟</Text>
          <Text className='text-xs text-muted-foreground mt-1'>扮演HR面试候选人，训练选人眼光</Text>
        </View>
      </View>
    </CardContent>
  </Card>
</View>
```

---

### 3. HR模拟 - 候选人列表 src/pages/hr-sim/candidates.tsx

**当前问题**：
- 顶部有 ArrowLeft 返回按钮（第114-115行）
- 顶部有 "新建候选人" 按钮

**修改方案**：
```tsx
// 修改后 - 纯展示样式
<View className='px-4 pt-3'>
  <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
    <View className='h-2' style={{ background: 'linear-gradient(90deg, #3B82F6, #2563EB, #1D4ED8)' }} />
    <CardContent className='p-4'>
      <View className='flex flex-row items-center gap-3'>
        <View className='w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0'>
          <Users size={22} color='#3B82F6' />
        </View>
        <View className='flex-1 min-w-0'>
          <Text className='text-base font-semibold text-foreground'>候选人管理</Text>
          <Text className='text-xs text-muted-foreground mt-1'>管理面试候选人资料</Text>
        </View>
        <Badge variant='secondary' className='flex-shrink-0'>
          {candidates.length}人
        </Badge>
      </View>
    </CardContent>
  </Card>
</View>

// "新建候选人"按钮移到列表上方
<View className='px-4 mt-4'>
  <Button className='w-full btn-shimmer' onClick={goToCreate}>
    <Plus size={16} />
    <Text className='ml-2'>新建候选人</Text>
  </Button>
</View>
```

---

### 4. HR模拟 - 候选人编辑 src/pages/hr-sim/candidate-edit.tsx

**当前问题**：
- 顶部有 ArrowLeft 返回按钮（第125-126行）

**修改方案**：
```tsx
// 修改后 - 纯展示样式
<View className='px-4 pt-3'>
  <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
    <View className='h-2' style={{ background: 'linear-gradient(90deg, #F59E0B, #D97706, #B45309)' }} />
    <CardContent className='p-4'>
      <View className='flex flex-row items-center gap-3'>
        <View className='w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0'>
          <User size={22} color='#F59E0B' />
        </View>
        <View className='flex-1 min-w-0'>
          <Text className='text-base font-semibold text-foreground'>
            {candidateId ? '编辑候选人' : '新建候选人'}
          </Text>
          <Text className='text-xs text-muted-foreground mt-1'>填写候选人基本信息</Text>
        </View>
      </View>
    </CardContent>
  </Card>
</View>
```

---

### 5. HR模拟 - 报告列表 src/pages/hr-sim/report.tsx

**当前问题**：
- 顶部有 ArrowLeft 返回按钮（第124行）

**修改方案**：
```tsx
// 修改后 - 纯展示样式
<View className='px-4 pt-3'>
  <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
    <View className='h-2' style={{ background: 'linear-gradient(90deg, #10B981, #059669, #047857)' }} />
    <CardContent className='p-4'>
      <View className='flex flex-row items-center gap-3'>
        <View className='w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0'>
          <FileCheck size={22} color='#10B981' />
        </View>
        <View className='flex-1 min-w-0'>
          <Text className='text-base font-semibold text-foreground'>面试报告</Text>
          <Text className='text-xs text-muted-foreground mt-1'>查看面试评估结果</Text>
        </View>
      </View>
    </CardContent>
  </Card>
</View>
```

---

### 6. HR模拟 - 报告详情 src/pages/hr-sim/report-detail.tsx

**当前问题**：
- 顶部有 ArrowLeft 返回按钮（第49-50行）

**修改方案**：同上，改为纯展示样式

---

### 7. HR模拟 - 历史记录 src/pages/hr-sim/history.tsx

**当前问题**：
- 顶部有 ArrowLeft 返回按钮（第88-89行）

**修改方案**：同上，改为纯展示样式

---

### 8. 职业沙盘 src/pages/plan/sandbox.tsx

**当前问题**：
- 顶部有 ArrowLeft 返回按钮（第91-92行）

**修改方案**：
```tsx
// 修改后 - 纯展示样式
<View className='px-4 pt-3'>
  <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
    <View className='h-2' style={{ background: 'linear-gradient(90deg, #8B5CF6, #7C3AED, #6D28D9)' }} />
    <CardContent className='p-4'>
      <View className='flex flex-row items-center gap-3'>
        <View className='w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0'>
          <Sparkles size={22} color='#8B5CF6' />
        </View>
        <View className='flex-1 min-w-0'>
          <Text className='text-base font-semibold text-foreground'>职业沙盘</Text>
          <Text className='text-xs text-muted-foreground mt-1'>AI帮你规划职业道路</Text>
        </View>
      </View>
    </CardContent>
  </Card>
</View>
```

---

### 9. 面试房间 src/pages/interview/room.tsx

**当前问题**：
- 顶部有 ArrowLeft 返回按钮（第137-138行）

**修改方案**：
```tsx
// 修改后 - 纯展示样式
<View className='px-4 pt-3'>
  <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
    <View className='h-2' style={{ background: 'linear-gradient(90deg, #E26A5C, #FF6B35, #D4A574)' }} />
    <CardContent className='p-4'>
      <View className='flex flex-row items-center gap-3'>
        <View className='w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0'>
          <Swords size={22} color='#E26A5C' />
        </View>
        <View className='flex-1 min-w-0'>
          <Text className='text-base font-semibold text-foreground'>模拟面试</Text>
          <Text className='text-xs text-muted-foreground mt-1'>AI面试官1对1训练</Text>
        </View>
      </View>
    </CardContent>
  </Card>
</View>
```

---

### 10. 面试报告 src/pages/interview/report.tsx

**当前问题**：
- 顶部有 ArrowLeft 返回按钮（第37-38行）

**修改方案**：同上，改为纯展示样式

---

## 实施步骤

### 第一步：修改简历库页面
1. 移除顶部的 ArrowLeft 返回按钮
2. 移除顶部的 "新建" 按钮
3. 将顶部改为纯展示卡片（参考首页样式）
4. 将 "新建" 按钮移到简历列表上方

### 第二步：修改 HR模拟 相关页面
1. hr-sim/index.tsx - 移除返回按钮，改为纯展示
2. hr-sim/candidates.tsx - 移除返回按钮，将"新建候选人"按钮移到列表上方
3. hr-sim/candidate-edit.tsx - 移除返回按钮，改为纯展示
4. hr-sim/report.tsx - 移除返回按钮，改为纯展示
5. hr-sim/report-detail.tsx - 移除返回按钮，改为纯展示
6. hr-sim/history.tsx - 移除返回按钮，改为纯展示

### 第三步：修改其他页面
1. plan/sandbox.tsx - 移除返回按钮，改为纯展示
2. interview/room.tsx - 移除返回按钮，改为纯展示
3. interview/report.tsx - 移除返回按钮，改为纯展示

### 第四步：测试
1. 测试所有页面顶部显示是否正常
2. 测试返回功能是否由小程序原生导航栏处理
3. 测试功能按钮是否在正确位置
4. 测试没有按钮堆叠问题

---

## 注意事项

1. **保留入场动画**：所有顶部卡片都要有 `anim-fade-in-up` 动画
2. **渐变装饰条**：每个页面使用不同的渐变颜色，保持视觉区分
3. **图标颜色匹配**：图标背景色和渐变色要协调
4. **Badge显示数量**：有列表的页面显示数量（如简历数、候选人数）
5. **功能按钮位置**：新建、保存等按钮移到页面主体区域
6. **移除ArrowLeft导入**：修改后不再需要 ArrowLeft 图标

---

## 关键代码模式

### 纯展示顶部卡片模板
```tsx
<View className='px-4 pt-3'>
  <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
    {/* 渐变装饰条 */}
    <View className='h-2' style={{ background: 'linear-gradient(90deg, 颜色1, 颜色2, 颜色3)' }} />
    <CardContent className='p-4'>
      <View className='flex flex-row items-center gap-3'>
        {/* 图标 */}
        <View className='w-11 h-11 rounded-xl bg-xxx-50 flex items-center justify-center flex-shrink-0'>
          <IconComponent size={22} color='#xxx' />
        </View>
        {/* 标题和描述 */}
        <View className='flex-1 min-w-0'>
          <Text className='text-base font-semibold text-foreground'>页面标题</Text>
          <Text className='text-xs text-muted-foreground mt-1'>页面描述</Text>
        </View>
        {/* 可选：数量徽章 */}
        <Badge variant='secondary' className='flex-shrink-0'>
          {count}个
        </Badge>
      </View>
    </CardContent>
  </Card>
</View>
```

### 功能按钮移到主体区域
```tsx
// 在顶部卡片下方添加功能按钮
<View className='px-4 mt-4'>
  <Button className='w-full btn-shimmer' onClick={handleAction}>
    <Plus size={16} />
    <Text className='ml-2'>新建xxx</Text>
  </Button>
</View>
```

---

## 验证清单

- [ ] 所有页面顶部没有 ArrowLeft 返回按钮
- [ ] 所有页面顶部没有功能按钮（新建、保存等）
- [ ] 所有页面顶部是纯展示卡片
- [ ] 所有顶部卡片有入场动画
- [ ] 返回功能由小程序原生导航栏处理
- [ ] 功能按钮在页面主体正确位置
- [ ] 没有按钮堆叠问题
- [ ] 视觉风格统一且协调
