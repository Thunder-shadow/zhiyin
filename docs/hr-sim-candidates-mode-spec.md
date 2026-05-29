# HR模拟 - 候选人列表页面模式区分 Spec

## 项目信息
- 项目路径：/root/zhiyin
- 分支：main
- 目标：区分"开始面试"和"候选人管理"两种模式的UI和功能

## 问题分析

当前候选人列表页面（src/pages/hr-sim/candidates.tsx）有两个入口：

1. **开始面试入口**：`/pages/hr-sim/candidates?mode=select`（第221行）
2. **候选人管理入口**：`/pages/hr-sim/candidates`（第271行）

但当前代码没有区分这两种模式，都会显示：
- 新建候选人按钮
- 编辑按钮（Pencil图标）
- 删除按钮（Trash2图标）

## 需求

### 模式1：选择模式（mode=select）
**入口**：从"开始面试"按钮进入
**功能限制**：
- ✅ 可以查看候选人列表
- ✅ 可以搜索候选人
- ✅ 可以选择候选人开始面试
- ❌ 不能新建候选人
- ❌ 不能编辑候选人
- ❌ 不能删除候选人

**UI变化**：
- 顶部标题：选择候选人
- 顶部描述：选择一个候选人开始面试
- 不显示"新建候选人"按钮
- 候选人卡片只显示"开始面试"按钮，不显示编辑/删除按钮

### 模式2：管理模式（默认）
**入口**：从"候选人管理"按钮进入
**功能完整**：
- ✅ 可以查看候选人列表
- ✅ 可以搜索候选人
- ✅ 可以新建候选人
- ✅ 可以编辑候选人
- ✅ 可以删除候选人

**UI变化**：
- 顶部标题：候选人管理
- 顶部描述：管理面试候选人资料
- 显示"新建候选人"按钮
- 候选人卡片显示"开始面试"、"编辑"、"删除"三个按钮

---

## 修改方案

### 修改文件
src/pages/hr-sim/candidates.tsx

### 代码修改

#### 1. 获取mode参数

```tsx
// 在组件顶部获取路由参数
import { useRouter } from '@tarojs/taro'

export default function Candidates() {
  const router = useRouter()
  const mode = router.params.mode || 'manage' // 'select' 或 'manage'
  
  // 判断是否为选择模式
  const isSelectMode = mode === 'select'
  
  // ... 其他代码
}
```

#### 2. 修改顶部标题

```tsx
{/* 顶部 */}
<View
  className='px-4 pb-4 pt-4 rounded-b-2xl relative overflow-hidden'
  style={{
    background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)',
  }}
>
  <View className='absolute -top-4 -right-4 w-20 h-20 rounded-full' style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
  <View className='flex flex-row items-center gap-3 relative'>
    <View className='flex-1'>
      <Text className='block text-white font-bold text-base'>
        {isSelectMode ? '选择候选人' : '候选人管理'}
      </Text>
      <Text className='block text-gray-300 text-xs'>
        {isSelectMode ? '选择一个候选人开始面试' : '管理面试候选人资料'}
      </Text>
    </View>
  </View>
</View>
```

#### 3. 条件显示"新建候选人"按钮

```tsx
<View className='px-4 pt-4'>
  {/* 新建候选人按钮 - 仅管理模式显示 */}
  {!isSelectMode && (
    <Button className='w-full btn-shimmer btn-press mb-4' onClick={goToCreate}>
      <Plus size={16} />
      <Text className='ml-2'>新建候选人</Text>
    </Button>
  )}

  {/* 搜索框 */}
  <View className='bg-surface-container rounded-xl px-3 py-2 mb-4'>
    {/* ... 搜索框代码 ... */}
  </View>
</View>
```

#### 4. 修改候选人卡片的操作按钮

```tsx
{/* 操作按钮 */}
<View className='flex flex-row items-center gap-2 mt-3 pt-3' style={{ borderTop: '1px solid #F0F2EF' }}>
  <Button
    size='sm'
    className={`flex-1 bg-primary text-on-primary border-none rounded-lg ${isSelectMode ? '' : 'flex-1'}`}
    onClick={() => startInterview(candidate)}
  >
    <Swords size={14} color='#fff' />
    <Text className='ml-1'>开始面试</Text>
  </Button>
  
  {/* 编辑和删除按钮 - 仅管理模式显示 */}
  {!isSelectMode && (
    <>
      <Button
        size='sm'
        variant='ghost'
        className='px-3 rounded-lg'
        onClick={() => goToEdit(candidate.id)}
      >
        <Pencil size={14} color='#6B7B74' />
      </Button>
      <Button
        size='sm'
        variant='ghost'
        className='px-3 rounded-lg'
        onClick={() => deleteCandidate(candidate)}
      >
        <Trash2 size={14} color='#E26A5C' />
      </Button>
    </>
  )}
</View>
```

---

## 实施步骤

### 第一步：获取路由参数
1. 导入 `useRouter` hook
2. 获取 `mode` 参数
3. 定义 `isSelectMode` 变量

### 第二步：修改顶部标题
1. 根据 `isSelectMode` 显示不同的标题
2. 根据 `isSelectMode` 显示不同的描述

### 第三步：条件显示新建按钮
1. 用 `{!isSelectMode && (...)}` 包裹"新建候选人"按钮

### 第四步：修改操作按钮
1. 用 `{!isSelectMode && (...)}` 包裹编辑和删除按钮
2. 调整"开始面试"按钮的样式（管理模式下不占满整行）

### 第五步：测试
1. 测试从"开始面试"进入 → 只能选择候选人，不能编辑/删除
2. 测试从"候选人管理"进入 → 可以新建、编辑、删除
3. 测试搜索功能在两种模式下都正常
4. 测试选择候选人开始面试的流程

---

## 关键代码片段

### 完整的条件渲染示例

```tsx
export default function Candidates() {
  const router = useRouter()
  const mode = router.params.mode || 'manage'
  const isSelectMode = mode === 'select'
  
  const [candidates, setCandidates] = useState<HrCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')

  // ... 其他函数

  return (
    <View className='min-h-full bg-background pb-safe'>
      {/* 顶部 */}
      <View
        className='px-4 pb-4 pt-4 rounded-b-2xl relative overflow-hidden'
        style={{
          background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)',
        }}
      >
        <View className='absolute -top-4 -right-4 w-20 h-20 rounded-full' style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
        <View className='flex flex-row items-center gap-3 relative'>
          <View className='flex-1'>
            <Text className='block text-white font-bold text-base'>
              {isSelectMode ? '选择候选人' : '候选人管理'}
            </Text>
            <Text className='block text-gray-300 text-xs'>
              {isSelectMode ? '选择一个候选人开始面试' : '管理面试候选人资料'}
            </Text>
          </View>
        </View>
      </View>

      <View className='px-4 pt-4'>
        {/* 新建候选人按钮 - 仅管理模式显示 */}
        {!isSelectMode && (
          <Button className='w-full btn-shimmer btn-press mb-4' onClick={goToCreate}>
            <Plus size={16} />
            <Text className='ml-2'>新建候选人</Text>
          </Button>
        )}

        {/* 搜索框 */}
        <View className='bg-surface-container rounded-xl px-3 py-2 mb-4'>
          <View className='flex flex-row items-center gap-2'>
            <Search size={16} color='#6B7B7480' />
            <Input
              className='flex-1 bg-transparent text-sm'
              placeholder='搜索候选人...'
              value={searchKeyword}
              onInput={(e: any) => setSearchKeyword(e.detail.value)}
            />
          </View>
        </View>

        {/* 候选人列表 */}
        {loading ? (
          <View className='flex flex-col items-center py-16'>
            <Text className='block text-sm text-muted-foreground'>加载中...</Text>
          </View>
        ) : filteredCandidates.length === 0 ? (
          {/* 空状态 */}
        ) : (
          <View>
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className='mb-3 shadow-card'>
                <CardContent className='p-4'>
                  {/* 候选人信息 */}
                  <View className='flex flex-row items-center gap-3'>
                    {/* ... 头像和信息 ... */}
                  </View>

                  {/* 操作按钮 */}
                  <View className='flex flex-row items-center gap-2 mt-3 pt-3' style={{ borderTop: '1px solid #F0F2EF' }}>
                    <Button
                      size='sm'
                      className='flex-1 bg-primary text-on-primary border-none rounded-lg'
                      onClick={() => startInterview(candidate)}
                    >
                      <Swords size={14} color='#fff' />
                      <Text className='ml-1'>开始面试</Text>
                    </Button>
                    
                    {/* 编辑和删除按钮 - 仅管理模式显示 */}
                    {!isSelectMode && (
                      <>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='px-3 rounded-lg'
                          onClick={() => goToEdit(candidate.id)}
                        >
                          <Pencil size={14} color='#6B7B74' />
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='px-3 rounded-lg'
                          onClick={() => deleteCandidate(candidate)}
                        >
                          <Trash2 size={14} color='#E26A5C' />
                        </Button>
                      </>
                    )}
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
```

---

## 验证清单

- [ ] 从"开始面试"进入，顶部显示"选择候选人"
- [ ] 从"开始面试"进入，不显示"新建候选人"按钮
- [ ] 从"开始面试"进入，候选人卡片只显示"开始面试"按钮
- [ ] 从"候选人管理"进入，顶部显示"候选人管理"
- [ ] 从"候选人管理"进入，显示"新建候选人"按钮
- [ ] 从"候选人管理"进入，候选人卡片显示"开始面试"、"编辑"、"删除"三个按钮
- [ ] 搜索功能在两种模式下都正常
- [ ] 选择候选人开始面试的流程正常
- [ ] 编辑/删除候选人的流程正常（管理模式下）
