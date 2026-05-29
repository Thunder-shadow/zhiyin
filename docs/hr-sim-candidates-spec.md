# HR模拟面试全面优化 + 驾驶舱修复 + UI统一 Spec

## 项目信息
- 项目路径：/root/zhiyin
- 分支：main
- 目标：HR模拟面试数据改为用户创建、修复驾驶舱跳转、统一UI风格

## 需求清单

### 需求1：HR反向模拟 - 用户创建候选人
**当前问题**：候选人数据是写死的假数据（张明、李华、王芳）
**期望效果**：
1. 删除所有假数据
2. 用户可以自己创建候选人卡片
3. 卡片信息要全面（姓名、学校、专业、背景、性格、真实水平等）
4. 信息持久化到数据库
5. AI根据用户创建的候选人信息回复

**实现方案**：
1. 创建候选人表 `hr_candidates`
2. 创建候选人管理页面 `/pages/hr-sim/candidates`
3. 创建候选人编辑页面 `/pages/hr-sim/candidate-edit`
4. 修改HR模拟首页，显示用户创建的候选人列表
5. 修改AI服务，使用用户创建的候选人信息

### 需求2：修复驾驶舱页面跳转
**当前问题**：点击"职业沙盘"和"简历库"按钮页面不跳转
**可能原因**：
1. 路径配置错误
2. `switchTab` 和 `navigateTo` 混用
3. 页面未注册

**实现方案**：
1. 检查页面路由配置
2. 修复跳转逻辑
3. 确保页面已注册

### 需求3：头像显示问题统一修复
**当前问题**：部分页面头像显示不全
**检查范围**：
1. 首页（index）
2. 仪表盘（dashboard）
3. 个人中心（profile）
4. 面试大厅（interview/lobby）
5. 简历列表（resume/list）
6. 公司大厅（company/hall）

**实现方案**：
1. 统一添加 `overflow: 'hidden'` 到头像容器
2. 确保头像在容器内居中
3. 检查所有圆形头像的样式

### 需求4：交互页面排版统一
**当前问题**：各页面布局风格不一致
**期望效果**：统一按照HR模拟面试的风格
**统一规范**：
1. 顶部：固定定位，渐变背景
2. 中间：可滚动区域，适当padding
3. 底部：固定定位（如有输入框）
4. 卡片：统一阴影和圆角
5. 动画：统一入场动画

---

## 详细实现方案

### 1. 候选人数据模型

```typescript
interface HrCandidate {
  id?: number
  user_id?: string
  name: string                    // 姓名
  school: string                  // 学校
  major: string                   // 专业
  background: string              // 背景经历
  personality: string             // 性格特点
  real_level: 'A' | 'B' | 'C'    // 真实水平
  summary?: string                // 简短描述
  tag?: string                    // 标签（如：技术型、社交型）
  color?: string                  // 卡片颜色
  created_at?: string
  updated_at?: string
}
```

### 2. 候选人管理页面

**新建文件**：`src/pages/hr-sim/candidates.tsx`

```tsx
import { View, Text, ScrollView } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, User, ChevronRight, Edit, Trash2 } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

interface HrCandidate {
  id: number
  name: string
  school: string
  major: string
  background: string
  personality: string
  real_level: string
  summary?: string
  tag?: string
  color?: string
}

export default function HrCandidates() {
  const [candidates, setCandidates] = useState<HrCandidate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCandidates()
  }, [])

  const loadCandidates = async () => {
    try {
      const res = await Network.request({ url: '/api/hr-candidates' })
      if (res.data?.code === 0) {
        setCandidates(res.data.data || [])
      }
    } catch (err) {
      console.error('Load candidates error:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteCandidate = async (id: number) => {
    const confirm = await Taro.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确认删除该候选人？',
      confirmText: '删除',
      confirmColor: '#EF4444'
    })
    
    if (confirm.confirm) {
      try {
        await Network.request({
          url: `/api/hr-candidates/${id}`,
          method: 'DELETE'
        })
        setCandidates(candidates.filter(c => c.id !== id))
        Taro.showToast({ title: '删除成功', icon: 'success' })
      } catch (err) {
        Taro.showToast({ title: '删除失败', icon: 'error' })
      }
    }
  }

  const startInterview = (candidate: HrCandidate) => {
    // 保存选中的候选人到缓存
    Taro.setStorageSync('hr_selected_candidate', candidate)
    Taro.navigateTo({ url: `/pages/hr-sim/index?candidateId=${candidate.id}` })
  }

  return (
    <View className="min-h-full bg-background">
      {/* 顶部 - fixed */}
      <View
        className="px-4 pt-4 pb-3 rounded-b-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <View className="absolute -top-4 -right-4 w-20 h-20 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
        <View className="flex flex-row items-center gap-3 relative">
          <View onClick={() => Taro.navigateBack()} className="p-1 btn-press">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="block text-white font-bold text-base">候选人管理</Text>
            <Text className="block text-gray-300 text-xs">创建和管理面试候选人</Text>
          </View>
          <Button
            size="sm"
            className="bg-accent text-white border-none rounded-lg btn-shimmer btn-press"
            onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/candidate-edit' })}
          >
            <Plus size={14} color="#fff" />
            <Text className="text-white ml-1">新建</Text>
          </Button>
        </View>
      </View>

      {/* 内容区 */}
      <ScrollView
        className="flex-1 px-4"
        style={{ paddingTop: '90px', paddingBottom: '20px' }}
        scrollY
      >
        {loading ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="block text-sm text-muted-foreground">加载中...</Text>
          </View>
        ) : candidates.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-8 flex flex-col items-center">
              <User size={48} color="#D1D5DB" />
              <Text className="block text-base font-semibold text-foreground mt-4">
                还没有候选人
              </Text>
              <Text className="block text-sm text-muted-foreground mt-2 text-center">
                创建候选人后，可以进行HR模拟面试
              </Text>
              <Button
                className="mt-6 btn-shimmer btn-press"
                onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/candidate-edit' })}
              >
                <Plus size={16} color="#fff" />
                <Text>创建第一个候选人</Text>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <View className="flex flex-col gap-3">
            {candidates.map((candidate) => (
              <Card
                key={candidate.id}
                className="shadow-card card-hover"
              >
                <CardContent className="p-4">
                  <View className="flex flex-row items-start gap-3">
                    <View
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${candidate.color || '#8B5CF6'}15` }}
                    >
                      <User size={28} color={candidate.color || '#8B5CF6'} />
                    </View>
                    <View className="flex-1 min-w-0">
                      <View className="flex flex-row items-center gap-2 mb-1">
                        <Text className="block font-bold text-foreground text-lg">
                          {candidate.name}
                        </Text>
                        {candidate.tag && (
                          <Badge
                            className="text-xs border-none"
                            style={{
                              backgroundColor: `${candidate.color || '#8B5CF6'}15`,
                              color: candidate.color || '#8B5CF6'
                            }}
                          >
                            {candidate.tag}
                          </Badge>
                        )}
                      </View>
                      <Text className="block text-sm text-muted-foreground">
                        {candidate.school} · {candidate.major}
                      </Text>
                      {candidate.summary && (
                        <Text className="block text-xs text-muted-foreground mt-1" style={{ opacity: 0.7 }}>
                          {candidate.summary}
                        </Text>
                      )}
                      <View className="flex flex-row items-center gap-2 mt-2">
                        <View className="px-2 py-1 rounded bg-muted">
                          <Text className="text-xs text-muted-foreground">
                            水平：{candidate.real_level}级
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  {/* 操作按钮 */}
                  <View className="flex flex-row items-center justify-end gap-2 mt-3 pt-3 border-t border-outline-variant border-opacity-15">
                    <Button
                      variant="outline"
                      size="sm"
                      className="btn-press"
                      onClick={() => Taro.navigateTo({ 
                        url: `/pages/hr-sim/candidate-edit?id=${candidate.id}` 
                      })}
                    >
                      <Edit size={14} />
                      <Text className="ml-1">编辑</Text>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="btn-press text-destructive"
                      onClick={() => deleteCandidate(candidate.id)}
                    >
                      <Trash2 size={14} />
                      <Text className="ml-1">删除</Text>
                    </Button>
                    <Button
                      size="sm"
                      className="btn-shimmer btn-press"
                      onClick={() => startInterview(candidate)}
                    >
                      <Text>开始面试</Text>
                      <ChevronRight size={14} color="#fff" />
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
```

### 3. 候选人编辑页面

**新建文件**：`src/pages/hr-sim/candidate-edit.tsx`

```tsx
import { View, Text, ScrollView } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Save, User } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

const LEVEL_OPTIONS = [
  { value: 'A', label: 'A级 - 优秀', color: '#10B981' },
  { value: 'B', label: 'B级 - 良好', color: '#3B82F6' },
  { value: 'C', label: 'C级 - 一般', color: '#F59E0B' },
]

const TAG_OPTIONS = [
  { value: '技术型', color: '#3B82F6' },
  { value: '社交型', color: '#8B5CF6' },
  { value: '综合型', color: '#10B981' },
  { value: '创新型', color: '#F59E0B' },
  { value: '稳健型', color: '#6366F1' },
]

export default function CandidateEdit() {
  const [candidateId, setCandidateId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    major: '',
    background: '',
    personality: '',
    real_level: 'B',
    summary: '',
    tag: '',
    color: '#8B5CF6'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const id = currentPage.options?.id
    
    if (id) {
      setCandidateId(parseInt(id))
      loadCandidate(parseInt(id))
    }
  }, [])

  const loadCandidate = async (id: number) => {
    try {
      const res = await Network.request({ url: `/api/hr-candidates/${id}` })
      if (res.data?.code === 0 && res.data.data) {
        setFormData(res.data.data)
      }
    } catch (err) {
      console.error('Load candidate error:', err)
      Taro.showToast({ title: '加载失败', icon: 'error' })
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'error' })
      return
    }
    if (!formData.school.trim()) {
      Taro.showToast({ title: '请输入学校', icon: 'error' })
      return
    }
    if (!formData.major.trim()) {
      Taro.showToast({ title: '请输入专业', icon: 'error' })
      return
    }

    setLoading(true)
    try {
      const url = candidateId 
        ? `/api/hr-candidates/${candidateId}` 
        : '/api/hr-candidates'
      const method = candidateId ? 'PUT' : 'POST'
      
      await Network.request({
        url,
        method,
        data: formData
      })
      
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (err) {
      console.error('Save candidate error:', err)
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-full bg-background">
      {/* 顶部 - fixed */}
      <View
        className="px-4 pt-4 pb-3 rounded-b-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <View className="absolute -top-4 -right-4 w-20 h-20 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
        <View className="flex flex-row items-center gap-3 relative">
          <View onClick={() => Taro.navigateBack()} className="p-1 btn-press">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="block text-white font-bold text-base">
              {candidateId ? '编辑候选人' : '新建候选人'}
            </Text>
            <Text className="block text-gray-300 text-xs">
              填写候选人的详细信息
            </Text>
          </View>
          <Button
            size="sm"
            className="bg-accent text-white border-none rounded-lg btn-shimmer btn-press"
            onClick={handleSave}
            disabled={loading}
          >
            <Save size={14} color="#fff" />
            <Text className="text-white ml-1">{loading ? '保存中...' : '保存'}</Text>
          </Button>
        </View>
      </View>

      {/* 表单区 */}
      <ScrollView
        className="flex-1 px-4"
        style={{ paddingTop: '90px', paddingBottom: '20px' }}
        scrollY
      >
        <Card className="shadow-card mb-4">
          <CardContent className="p-4">
            <Text className="block text-base font-semibold text-foreground mb-4">
              基本信息
            </Text>
            
            <View className="mb-4">
              <Label className="block text-sm font-medium text-foreground mb-2">
                姓名 *
              </Label>
              <Input
                className="w-full"
                placeholder="请输入候选人姓名"
                value={formData.name}
                onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
              />
            </View>

            <View className="mb-4">
              <Label className="block text-sm font-medium text-foreground mb-2">
                学校 *
              </Label>
              <Input
                className="w-full"
                placeholder="请输入毕业院校"
                value={formData.school}
                onInput={(e) => setFormData({ ...formData, school: e.detail.value })}
              />
            </View>

            <View className="mb-4">
              <Label className="block text-sm font-medium text-foreground mb-2">
                专业 *
              </Label>
              <Input
                className="w-full"
                placeholder="请输入专业"
                value={formData.major}
                onInput={(e) => setFormData({ ...formData, major: e.detail.value })}
              />
            </View>

            <View className="mb-4">
              <Label className="block text-sm font-medium text-foreground mb-2">
                简短描述
              </Label>
              <Input
                className="w-full"
                placeholder="如：3段大厂实习，GPA 3.8"
                value={formData.summary}
                onInput={(e) => setFormData({ ...formData, summary: e.detail.value })}
              />
            </View>
          </CardContent>
        </Card>

        <Card className="shadow-card mb-4">
          <CardContent className="p-4">
            <Text className="block text-base font-semibold text-foreground mb-4">
              详细信息
            </Text>

            <View className="mb-4">
              <Label className="block text-sm font-medium text-foreground mb-2">
                背景经历
              </Label>
              <Textarea
                className="w-full"
                placeholder="请描述候选人的教育背景、实习经历、项目经验等"
                value={formData.background}
                onInput={(e) => setFormData({ ...formData, background: e.detail.value })}
                autoHeight
              />
            </View>

            <View className="mb-4">
              <Label className="block text-sm font-medium text-foreground mb-2">
                性格特点
              </Label>
              <Textarea
                className="w-full"
                placeholder="请描述候选人的性格特点，如：外向能说、技术宅、沉稳干练等"
                value={formData.personality}
                onInput={(e) => setFormData({ ...formData, personality: e.detail.value })}
                autoHeight
              />
            </View>

            <View className="mb-4">
              <Label className="block text-sm font-medium text-foreground mb-2">
                真实水平
              </Label>
              <View className="flex flex-row gap-2">
                {LEVEL_OPTIONS.map((option) => (
                  <View
                    key={option.value}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 ${
                      formData.real_level === option.value
                        ? 'border-primary bg-primary bg-opacity-10'
                        : 'border-outline-variant'
                    }`}
                    onClick={() => setFormData({ ...formData, real_level: option.value })}
                  >
                    <Text
                      className="block text-sm font-semibold text-center"
                      style={{ color: formData.real_level === option.value ? option.color : '#6B7B74' }}
                    >
                      {option.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Label className="block text-sm font-medium text-foreground mb-2">
                标签
              </Label>
              <View className="flex flex-row flex-wrap gap-2">
                {TAG_OPTIONS.map((option) => (
                  <View
                    key={option.value}
                    className={`px-3 py-1.5 rounded-full ${
                      formData.tag === option.value
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                    onClick={() => setFormData({ 
                      ...formData, 
                      tag: formData.tag === option.value ? '' : option.value,
                      color: option.color
                    })}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{ color: formData.tag === option.value ? '#fff' : '#6B7B74' }}
                    >
                      {option.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 预览卡片 */}
        <Card className="shadow-card mb-4">
          <CardContent className="p-4">
            <Text className="block text-base font-semibold text-foreground mb-4">
              预览效果
            </Text>
            
            <Card className="shadow-card" style={{ background: `${formData.color}08` }}>
              <CardContent className="p-4">
                <View className="flex flex-row items-center gap-3">
                  <View
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${formData.color}15` }}
                  >
                    <User size={28} color={formData.color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex flex-row items-center gap-2 mb-1">
                      <Text className="block font-bold text-foreground text-lg">
                        {formData.name || '候选人姓名'}
                      </Text>
                      {formData.tag && (
                        <Badge
                          className="text-xs border-none"
                          style={{ backgroundColor: `${formData.color}15`, color: formData.color }}
                        >
                          {formData.tag}
                        </Badge>
                      )}
                    </View>
                    <Text className="block text-sm text-muted-foreground">
                      {formData.school || '学校'} · {formData.major || '专业'}
                    </Text>
                    {formData.summary && (
                      <Text className="block text-xs text-muted-foreground mt-1">
                        {formData.summary}
                      </Text>
                    )}
                  </View>
                </View>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  )
}
```

### 4. 后端候选人API

**新建文件**：`server/src/modules/ai/hr-candidate.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '../storage/database/supabase-client';

@Injectable()
export class HrCandidateService {
  private supabase = SupabaseClient.getInstance();

  async list(userId: string) {
    const { data, error } = await this.supabase
      .from('hr_candidates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async detail(id: number, userId: string) {
    const { data, error } = await this.supabase
      .from('hr_candidates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async save(candidate: any, userId: string) {
    const { data, error } = await this.supabase
      .from('hr_candidates')
      .insert({
        ...candidate,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: number, candidate: any, userId: string) {
    const { data, error } = await this.supabase
      .from('hr_candidates')
      .update({
        ...candidate,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: number, userId: string) {
    const { error } = await this.supabase
      .from('hr_candidates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }
}
```

### 5. 修改AI服务使用用户创建的候选人

修改 `server/src/modules/ai/ai.service.ts` 中的 `handleHrSimStream` 和 `handleHrSim` 方法：

```typescript
// 获取候选人信息
const getResumeProfile = async (resumeIndex: number, candidateId?: number) => {
  // 如果有candidateId，从数据库获取
  if (candidateId) {
    const candidateService = new HrCandidateService();
    const candidate = await candidateService.detail(candidateId, headers['x-user-id'] || '');
    if (candidate) {
      return {
        name: candidate.name,
        school: candidate.school,
        background: `${candidate.major}，${candidate.background}`,
        personality: candidate.personality,
        real_level: candidate.real_level
      };
    }
  }
  
  // 兼容旧版本，使用resumeIndex
  const resumeProfiles = [
    { name: '张明', school: '北京大学·计算机', background: '3段大厂实习，GPA 3.8，算法竞赛省一', personality: '技术宅，不善社交但专业扎实', real_level: 'A' },
    { name: '李华', school: '中山大学·市场营销', background: '1段创业经历，学生会主席，社会实践丰富', personality: '外向能说，但技术基础弱', real_level: 'B' },
    { name: '王芳', school: '复旦·金融学', background: '2段投行实习，英语专八，CPA在考', personality: '沉稳干练，偶尔过于保守', real_level: 'A' },
  ];
  
  return resumeProfiles[resumeIndex] || resumeProfiles[0];
};
```

### 6. 修复驾驶舱页面跳转

检查 `src/pages/index/index.tsx` 和 `src/pages/dashboard/index.tsx`：

```typescript
// 问题：使用了 switchTab 但目标页面不是 TabBar 页面
// 修复：改用 navigateTo

const quickActions = [
  { label: '职业沙盘', path: '/pages/plan/sandbox', Icon: Sparkles, ... },
  { label: '副本大厅', path: '/pages/company/hall', Icon: Building, ... },
  { label: '训练场', path: '/pages/interview/lobby', Icon: Swords, ... },
  { label: '简历库', path: '/pages/resume/list', Icon: FileText, ... },
]

// 修复前
onClick={() => Taro.switchTab({ url: action.path })}

// 修复后
onClick={() => Taro.navigateTo({ url: action.path })}
```

### 7. 统一头像样式

在所有页面的头像容器添加 `overflow: 'hidden'`：

```tsx
// 修复前
<View className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
  <Bot size={14} color="#fff" />
</View>

// 修复后
<View className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1" style={{ overflow: 'hidden' }}>
  <Bot size={14} color="#fff" />
</View>
```

---

## 实施步骤

### 第一步：修复驾驶舱跳转
1. 检查所有 `switchTab` 调用
2. 改为 `navigateTo`（对于非TabBar页面）

### 第二步：统一头像样式
1. 搜索所有圆形头像组件
2. 添加 `overflow: 'hidden'`

### 第三步：创建候选人数据库表
1. 创建 `hr_candidates` 表
2. 添加索引和约束

### 第四步：创建后端候选人API
1. 创建 `HrCandidateService`
2. 创建 `HrCandidateController`
3. 注册到模块

### 第五步：创建前端候选人管理页面
1. 创建候选人列表页面
2. 创建候选人编辑页面
3. 注册页面路由

### 第六步：修改HR模拟面试流程
1. 删除假数据
2. 修改为从用户创建的候选人中选择
3. 修改AI服务，使用用户创建的候选人信息

### 第七步：统一交互页面排版
1. 参考HR模拟面试的布局风格
2. 统一顶部、中间、底部的样式
3. 统一卡片和动画效果

### 第八步：测试
1. 测试驾驶舱跳转
2. 测试头像显示
3. 测试候选人创建和编辑
4. 测试HR模拟面试流程
5. 测试各页面排版一致性

---

## 数据库表结构

```sql
CREATE TABLE hr_candidates (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  school VARCHAR(200) NOT NULL,
  major VARCHAR(100) NOT NULL,
  background TEXT,
  personality TEXT,
  real_level VARCHAR(10) DEFAULT 'B',
  summary VARCHAR(500),
  tag VARCHAR(50),
  color VARCHAR(20) DEFAULT '#8B5CF6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hr_candidates_user_id ON hr_candidates(user_id);
```

---

## 注意事项

1. **数据迁移**：确保旧版本的HR报告仍然可以查看
2. **向后兼容**：如果用户没有创建候选人，可以提供默认候选人或引导创建
3. **用户体验**：创建候选人流程要简单直观
4. **性能优化**：候选人列表要分页加载（如果数据量大）
5. **数据安全**：确保用户只能操作自己的候选人数据
