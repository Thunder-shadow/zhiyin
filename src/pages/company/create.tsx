import { View, Text, ScrollView } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Building, MapPin, GraduationCap, Briefcase, DollarSign, Save } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

const SALARY_OPTIONS = ['5-10K', '10-15K', '15-25K', '25-40K', '40K+']
const EDUCATION_OPTIONS = ['不限', '大专', '本科', '硕士', '博士']
const INDUSTRY_OPTIONS = [
  { key: 'internet', label: '互联网' },
  { key: 'finance', label: '金融' },
  { key: 'education', label: '教育' },
  { key: 'medical', label: '医疗' },
  { key: 'manufacturing', label: '制造业' },
  { key: 'other', label: '其他' },
]

export default function CreateJob() {
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    salary: '',
    location: '',
    education: '',
    industry: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 80)
  }, [])

  const update = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleCreate = async () => {
    if (!formData.company.trim()) {
      Taro.showToast({ title: '请输入公司名称', icon: 'none' })
      return
    }
    if (!formData.position.trim()) {
      Taro.showToast({ title: '请输入岗位名称', icon: 'none' })
      return
    }
    if (!formData.location.trim()) {
      Taro.showToast({ title: '请输入工作地点', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await Network.request({
        url: '/api/jobs',
        method: 'POST',
        data: {
          company: formData.company.trim(),
          position: formData.position.trim(),
          salary: formData.salary,
          location: formData.location.trim(),
          education: formData.education,
          industry: formData.industry,
          description: formData.description.trim(),
          status: 'pending',
        },
      })
      Taro.showToast({ title: '创建成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1200)
    } catch (err) {
      console.error('Create job error:', err)
      Taro.showToast({ title: '创建失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='min-h-full bg-background'>
      {/* 顶部 */}
      <View className='px-4 pt-3'>
        <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <View className='h-2' style={{ background: 'linear-gradient(90deg, #E26A5C, #FF6B35, #D4A574)' }} />
          <CardContent className='p-4'>
            <View className='flex flex-row items-center gap-3'>
              <View className='w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0' style={{ overflow: 'hidden' }}>
                <Briefcase size={22} color='#E26A5C' />
              </View>
              <View className='flex-1 min-w-0'>
                <Text className='text-base font-semibold text-foreground'>创建副本任务</Text>
                <Text className='text-xs text-muted-foreground mt-1'>填写目标公司和岗位信息</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 表单区 */}
      <ScrollView className='flex-1 px-4 pt-4 pb-6' scrollY>
        {/* 创建按钮 */}
        <View className='mb-4'>
          <Button
            className='w-full btn-shimmer btn-press'
            onClick={handleCreate}
            disabled={loading}
          >
            <Save size={16} />
            <Text className='ml-2'>{loading ? '创建中...' : '创建任务'}</Text>
          </Button>
        </View>

        {/* 基本信息 */}
        <Card className={`shadow-card mb-4 ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
          <CardContent className='p-4'>
            <Text className='block text-base font-semibold text-foreground mb-4'>基本信息</Text>

            <View className='mb-4'>
              <View className='flex flex-row items-center gap-2 mb-2'>
                <Building size={14} color='#6B7B74' />
                <Text className='text-sm font-medium text-foreground'>公司名称 *</Text>
              </View>
              <Input
                className='w-full bg-muted rounded-lg px-3 py-2 text-sm'
                placeholder='如：字节跳动、腾讯、阿里巴巴'
                value={formData.company}
                onInput={(e) => update('company', e.detail.value)}
              />
            </View>

            <View className='mb-4'>
              <View className='flex flex-row items-center gap-2 mb-2'>
                <Briefcase size={14} color='#6B7B74' />
                <Text className='text-sm font-medium text-foreground'>岗位名称 *</Text>
              </View>
              <Input
                className='w-full bg-muted rounded-lg px-3 py-2 text-sm'
                placeholder='如：产品经理、前端开发、运营'
                value={formData.position}
                onInput={(e) => update('position', e.detail.value)}
              />
            </View>

            <View className='mb-4'>
              <View className='flex flex-row items-center gap-2 mb-2'>
                <MapPin size={14} color='#6B7B74' />
                <Text className='text-sm font-medium text-foreground'>工作地点 *</Text>
              </View>
              <Input
                className='w-full bg-muted rounded-lg px-3 py-2 text-sm'
                placeholder='如：北京、上海、深圳'
                value={formData.location}
                onInput={(e) => update('location', e.detail.value)}
              />
            </View>

            <View className='mb-0'>
              <View className='flex flex-row items-center gap-2 mb-2'>
                <DollarSign size={14} color='#6B7B74' />
                <Text className='text-sm font-medium text-foreground'>薪资范围</Text>
              </View>
              <View className='flex flex-row flex-wrap gap-2'>
                {SALARY_OPTIONS.map(opt => (
                  <View
                    key={opt}
                    className={`px-4 py-2 rounded-full ${formData.salary === opt ? '' : 'bg-muted'}`}
                    style={formData.salary === opt ? { backgroundColor: '#E26A5C' } : undefined}
                    onClick={() => update('salary', formData.salary === opt ? '' : opt)}
                  >
                    <Text
                      className='text-sm font-medium'
                      style={{ color: formData.salary === opt ? '#fff' : '#6B7B74' }}
                    >
                      {opt}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 详细信息 */}
        <Card className={`shadow-card mb-4 ${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}>
          <CardContent className='p-4'>
            <Text className='block text-base font-semibold text-foreground mb-4'>详细信息</Text>

            <View className='mb-4'>
              <View className='flex flex-row items-center gap-2 mb-2'>
                <GraduationCap size={14} color='#6B7B74' />
                <Text className='text-sm font-medium text-foreground'>学历要求</Text>
              </View>
              <View className='flex flex-row flex-wrap gap-2'>
                {EDUCATION_OPTIONS.map(opt => (
                  <View
                    key={opt}
                    className={`px-4 py-2 rounded-full ${formData.education === opt ? '' : 'bg-muted'}`}
                    style={formData.education === opt ? { backgroundColor: '#3B82F6' } : undefined}
                    onClick={() => update('education', formData.education === opt ? '' : opt)}
                  >
                    <Text
                      className='text-sm font-medium'
                      style={{ color: formData.education === opt ? '#fff' : '#6B7B74' }}
                    >
                      {opt}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className='mb-4'>
              <View className='flex flex-row items-center gap-2 mb-2'>
                <Building size={14} color='#6B7B74' />
                <Text className='text-sm font-medium text-foreground'>行业类型</Text>
              </View>
              <View className='flex flex-row flex-wrap gap-2'>
                {INDUSTRY_OPTIONS.map(opt => (
                  <View
                    key={opt.key}
                    className={`px-4 py-2 rounded-full ${formData.industry === opt.key ? '' : 'bg-muted'}`}
                    style={formData.industry === opt.key ? { backgroundColor: '#10B981' } : undefined}
                    onClick={() => update('industry', formData.industry === opt.key ? '' : opt.key)}
                  >
                    <Text
                      className='text-sm font-medium'
                      style={{ color: formData.industry === opt.key ? '#fff' : '#6B7B74' }}
                    >
                      {opt.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className='mb-0'>
              <Text className='block text-sm font-medium text-foreground mb-2'>岗位描述（可选）</Text>
              <View className='bg-muted rounded-lg px-3 py-2'>
                <Textarea
                  className='w-full text-sm bg-transparent'
                  placeholder='填写岗位职责和要求，帮助AI更真实地模拟面试...'
                  value={formData.description}
                  onInput={(e) => update('description', e.detail.value)}
                  style={{ minHeight: '80px' }}
                />
              </View>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </View>
  )
}
