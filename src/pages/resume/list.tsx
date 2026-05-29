import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, ChevronRight, Calendar } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

/** 简历库 - 列表页 */
export default function ResumeList() {
  const [resumes, setResumes] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadResumes()
  }, [])

  const loadResumes = async () => {
    try {
      const res = await Network.request({ url: '/api/resumes' })
      console.log('Resumes response:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        setResumes(res.data.data)
      }
    } catch (err) {
      console.log('Load resumes error:', err)
    } finally {
      setTimeout(() => setLoaded(true), 80)
    }
  }

  return (
    <View className='min-h-full bg-background'>
      {/* 顶部 */}
      <View style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px' }}>
        <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <View className='h-2' style={{ background: 'linear-gradient(90deg, #2D6A4F, #40916C, #52B788)' }} />
          <CardContent className='p-4'>
            <View className='flex flex-row items-center gap-3'>
              <View className='w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0' style={{ overflow: 'hidden' }}>
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

      {/* 新建按钮 */}
      <View style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '16px' }}>
        <Button
          className='w-full btn-shimmer btn-press'
          onClick={() => Taro.navigateTo({ url: '/pages/resume/editor?mode=add' })}
        >
          <Plus size={16} />
          <Text className='ml-2'>新建简历</Text>
        </Button>
      </View>

      <View style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '16px' }}>
        {resumes.length === 0 ? (
          <Card className={`shadow-card ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
            <CardContent className='p-8 flex flex-col items-center'>
              <View className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3' style={{ overflow: 'hidden' }}>
                <FileText size={28} color='#B8C2BB' />
              </View>
              <Text className='block text-muted-foreground text-sm font-medium mt-1'>还没有简历</Text>
              <Text className='block text-muted-foreground text-xs mt-1' style={{ opacity: 0.6 }}>上传或创建简历，开启AI优化之旅</Text>
              <View
                className='mt-4 px-5 py-2 bg-primary rounded-full btn-press'
                onClick={() => Taro.navigateTo({ url: '/pages/resume/editor?mode=add' })}
              >
                <Text className='text-sm font-semibold text-primary-foreground'>创建简历</Text>
              </View>
            </CardContent>
          </Card>
        ) : (
          <View className='flex flex-col gap-3 pb-4'>
            {resumes.map((resume, idx) => (
              <Card
                key={resume.id}
                className={`shadow-card card-hover ${loaded ? `anim-fade-in-up anim-delay-${Math.min(idx + 1, 5)}` : 'opacity-0'}`}
                onClick={() => Taro.navigateTo({ url: `/pages/resume/editor?id=${resume.id}` })}
              >
                <CardContent className='p-4'>
                  <View className='flex flex-row items-center justify-between'>
                    <View className='flex flex-row items-center gap-3 flex-1'>
                      <View className='w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0'>
                        <FileText size={22} color='#10B981' />
                      </View>
                      <View className='flex-1'>
                        <Text className='block font-semibold text-foreground text-sm'>{resume.version_name || '未命名简历'}</Text>
                        <View className='flex flex-row items-center gap-2 mt-1'>
                          <Calendar size={10} color='#6B7B74' />
                          <Text className='text-muted-foreground text-xs'>
                            {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className='flex flex-row items-center gap-2'>
                      {resume.match_history?.length > 0 && (
                        <Badge className='bg-emerald-50 text-emerald-600 border-none text-xs'>
                          匹配{resume.match_history.length}次
                        </Badge>
                      )}
                      <ChevronRight size={16} color='#B8C2BB' />
                    </View>
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
