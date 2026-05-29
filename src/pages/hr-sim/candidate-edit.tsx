/* eslint-disable no-restricted-syntax */
import { View, Text, ScrollView, Textarea } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, User } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

const LEVEL_OPTIONS = [
  { value: 'A', label: 'A级 · 优秀', color: '#10B981' },
  { value: 'B', label: 'B级 · 良好', color: '#3B82F6' },
  { value: 'C', label: 'C级 · 一般', color: '#F59E0B' },
]

const TAG_OPTIONS = [
  { value: '技术型', color: '#3B82F6' },
  { value: '社交型', color: '#8B5CF6' },
  { value: '综合型', color: '#10B981' },
  { value: '创新型', color: '#F59E0B' },
  { value: '稳健型', color: '#6366F1' },
]

export default function CandidateEdit() {
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    major: '',
    background: '',
    personality: '',
    real_level: 'B',
    summary: '',
    tag: '',
    color: '#8B5CF6',
  })
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 80)
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const id = currentPage.options?.id
    if (id) {
      setCandidateId(id)
      loadCandidate(id)
    }
  }, [])

  const loadCandidate = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/hr-candidates/${id}` })
      if (res.data?.code === 0 && res.data.data) {
        const d = res.data.data
        setFormData({
          name: d.name || '',
          school: d.school || '',
          major: d.major || '',
          background: d.background || '',
          personality: d.personality || '',
          real_level: d.real_level || 'B',
          summary: d.summary || '',
          tag: d.tag || '',
          color: d.color || '#8B5CF6',
        })
      }
    } catch (err) {
      console.error('Load candidate error:', err)
      Taro.showToast({ title: '加载失败', icon: 'error' })
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!formData.school.trim()) {
      Taro.showToast({ title: '请输入学校', icon: 'none' })
      return
    }
    if (!formData.major.trim()) {
      Taro.showToast({ title: '请输入专业', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const url = candidateId ? `/api/hr-candidates/${candidateId}` : '/api/hr-candidates'
      const method = candidateId ? 'PUT' : 'POST'
      await Network.request({ url, method, data: formData })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1200)
    } catch (err) {
      console.error('Save candidate error:', err)
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const update = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <View className='min-h-full bg-background'>
      {/* 顶部 - fixed */}
      <View
        className='px-4 pt-4 pb-3 rounded-b-2xl relative overflow-hidden'
        style={{
          background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <View className='absolute -top-4 -right-4 w-20 h-20 rounded-full' style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
        <View className='flex flex-row items-center gap-3 relative'>
          <View onClick={() => Taro.navigateBack()} className='p-1 btn-press'>
            <ArrowLeft size={20} color='#fff' />
          </View>
          <View className='flex-1'>
            <Text className='block text-white font-bold text-base'>
              {candidateId ? '编辑候选人' : '新建候选人'}
            </Text>
            <Text className='block text-gray-300 text-xs'>填写候选人详细信息</Text>
          </View>
          <Button
            size='sm'
            className='bg-accent text-white border-none rounded-lg btn-shimmer btn-press'
            onClick={handleSave}
            disabled={loading}
          >
            <Save size={14} color='#fff' />
            <Text className='text-white ml-1'>{loading ? '保存中...' : '保存'}</Text>
          </Button>
        </View>
      </View>

      {/* 表单区 */}
      <ScrollView
        className='flex-1 px-4'
        style={{ paddingTop: '90px', paddingBottom: '20px' }}
        scrollY
      >
        {/* 基本信息 */}
        <Card className={`shadow-card mb-4 ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <CardContent className='p-4'>
            <Text className='block text-base font-semibold text-foreground mb-4'>基本信息</Text>

            <View className='mb-4'>
              <Text className='block text-sm font-medium text-foreground mb-2'>姓名 *</Text>
              <Input
                className='w-full bg-muted rounded-lg px-3 py-2 text-sm'
                placeholder='请输入候选人姓名'
                value={formData.name}
                onInput={(e) => update('name', e.detail.value)}
              />
            </View>

            <View className='mb-4'>
              <Text className='block text-sm font-medium text-foreground mb-2'>学校 *</Text>
              <Input
                className='w-full bg-muted rounded-lg px-3 py-2 text-sm'
                placeholder='请输入毕业院校'
                value={formData.school}
                onInput={(e) => update('school', e.detail.value)}
              />
            </View>

            <View className='mb-4'>
              <Text className='block text-sm font-medium text-foreground mb-2'>专业 *</Text>
              <Input
                className='w-full bg-muted rounded-lg px-3 py-2 text-sm'
                placeholder='请输入专业'
                value={formData.major}
                onInput={(e) => update('major', e.detail.value)}
              />
            </View>

            <View className='mb-0'>
              <Text className='block text-sm font-medium text-foreground mb-2'>简短描述</Text>
              <Input
                className='w-full bg-muted rounded-lg px-3 py-2 text-sm'
                placeholder='如：3段大厂实习，GPA 3.8'
                value={formData.summary}
                onInput={(e) => update('summary', e.detail.value)}
              />
            </View>
          </CardContent>
        </Card>

        {/* 详细信息 */}
        <Card className={`shadow-card mb-4 ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
          <CardContent className='p-4'>
            <Text className='block text-base font-semibold text-foreground mb-4'>详细信息</Text>

            <View className='mb-4'>
              <Text className='block text-sm font-medium text-foreground mb-2'>背景经历</Text>
              <View className='bg-muted rounded-lg px-3 py-2'>
                <Textarea
                  className='w-full text-sm bg-transparent'
                  placeholder='教育背景、实习经历、项目经验等'
                  value={formData.background}
                  onInput={(e) => update('background', e.detail.value)}
                  style={{ minHeight: '60px' }}
                />
              </View>
            </View>

            <View className='mb-4'>
              <Text className='block text-sm font-medium text-foreground mb-2'>性格特点</Text>
              <View className='bg-muted rounded-lg px-3 py-2'>
                <Textarea
                  className='w-full text-sm bg-transparent'
                  placeholder='如：外向能说、技术宅、沉稳干练等'
                  value={formData.personality}
                  onInput={(e) => update('personality', e.detail.value)}
                  style={{ minHeight: '60px' }}
                />
              </View>
            </View>

            <View className='mb-4'>
              <Text className='block text-sm font-medium text-foreground mb-2'>真实水平</Text>
              <View className='flex flex-row gap-2'>
                {LEVEL_OPTIONS.map(opt => (
                  <View
                    key={opt.value}
                    className={`flex-1 px-3 py-3 rounded-xl border-2 ${
                      formData.real_level === opt.value
                        ? 'border-primary bg-primary bg-opacity-10'
                        : 'border-outline-variant border-opacity-20 bg-muted'
                    }`}
                    onClick={() => update('real_level', opt.value)}
                  >
                    <Text
                      className='block text-sm font-semibold text-center'
                      style={{ color: formData.real_level === opt.value ? opt.color : '#6B7B74' }}
                    >
                      {opt.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className='mb-0'>
              <Text className='block text-sm font-medium text-foreground mb-2'>标签</Text>
              <View className='flex flex-row flex-wrap gap-2'>
                {TAG_OPTIONS.map(opt => (
                  <View
                    key={opt.value}
                    className={`px-4 py-2 rounded-full ${
                      formData.tag === opt.value ? '' : 'bg-muted'
                    }`}
                    style={formData.tag === opt.value ? { backgroundColor: opt.color } : undefined}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        tag: prev.tag === opt.value ? '' : opt.value,
                        color: opt.color,
                      }))
                    }}
                  >
                    <Text
                      className='text-sm font-medium'
                      style={{ color: formData.tag === opt.value ? '#fff' : '#6B7B74' }}
                    >
                      {opt.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 预览 */}
        <Card className={`shadow-card mb-4 ${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}>
          <CardContent className='p-4'>
            <Text className='block text-base font-semibold text-foreground mb-3'>预览效果</Text>
            <Card className='shadow-card' style={{ background: `${formData.color}08` }}>
              <CardContent className='p-4'>
                <View className='flex flex-row items-center gap-3'>
                  <View
                    className='w-14 h-14 rounded-xl flex items-center justify-center'
                    style={{ backgroundColor: `${formData.color}15` }}
                  >
                    <User size={28} color={formData.color} />
                  </View>
                  <View className='flex-1'>
                    <View className='flex flex-row items-center gap-2 mb-1'>
                      <Text className='block font-bold text-foreground text-lg'>
                        {formData.name || '候选人姓名'}
                      </Text>
                      {formData.tag && (
                        <Badge
                          className='text-xs border-none'
                          style={{ backgroundColor: `${formData.color}15`, color: formData.color }}
                        >
                          {formData.tag}
                        </Badge>
                      )}
                    </View>
                    <Text className='block text-sm text-muted-foreground'>
                      {formData.school || '学校'} · {formData.major || '专业'}
                    </Text>
                    {formData.summary && (
                      <Text className='block text-xs text-muted-foreground mt-1'>{formData.summary}</Text>
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
