import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, ChevronRight, ArrowLeft, Calendar } from 'lucide-react-taro'
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
    <View className="min-h-full bg-background">
      {/* 顶部 */}
      <View
        className="px-4 pt-4 pb-6 rounded-b-3xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 50%, #52B788 100%)' }}
      >
        {/* 背景装饰 */}
        <View className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
        <View className="absolute bottom-2 left-8 w-16 h-16 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />

        <View className="flex flex-row items-center gap-2 mb-2 relative">
          <View onClick={() => Taro.navigateBack()} className="p-1 btn-press">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="block text-white font-bold text-lg">简历库</Text>
            <Text className="block text-emerald-200 text-xs mt-1">管理你的简历，AI优化匹配</Text>
          </View>
          <Button
            size="sm"
            className="bg-white border-none rounded-lg btn-press"
            style={{ color: '#2D6A4F' }}
            onClick={() => Taro.navigateTo({ url: '/pages/resume/editor?mode=add' })}
          >
            <Plus size={14} color="#2D6A4F" />
            <Text className="ml-1 font-semibold" style={{ color: '#2D6A4F' }}>新建</Text>
          </Button>
        </View>

        {/* 统计信息 */}
        <View className="flex flex-row items-center gap-4 mt-2 relative">
          <View className="flex flex-row items-center gap-1.5">
            <FileText size={14} color="rgba(255,255,255,0.7)" />
            <Text className="text-white text-xs" style={{ opacity: 0.8 }}>{resumes.length} 份简历</Text>
          </View>
        </View>
      </View>

      <View className="px-4 -mt-3">
        {resumes.length === 0 ? (
          <Card className={`shadow-card ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
            <CardContent className="p-8 flex flex-col items-center">
              <View className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                <FileText size={28} color="#B8C2BB" />
              </View>
              <Text className="block text-muted-foreground text-sm font-medium mt-1">还没有简历</Text>
              <Text className="block text-muted-foreground text-xs mt-1" style={{ opacity: 0.6 }}>上传或创建简历，开启AI优化之旅</Text>
              <View
                className="mt-4 px-5 py-2 bg-primary rounded-full btn-press"
                onClick={() => Taro.navigateTo({ url: '/pages/resume/editor?mode=add' })}
              >
                <Text className="text-sm font-semibold text-primary-foreground">创建简历</Text>
              </View>
            </CardContent>
          </Card>
        ) : (
          <View className="flex flex-col gap-3 pb-4">
            {resumes.map((resume, idx) => (
              <Card
                key={resume.id}
                className={`shadow-card card-hover ${loaded ? `anim-fade-in-up anim-delay-${Math.min(idx + 1, 5)}` : 'opacity-0'}`}
                onClick={() => Taro.navigateTo({ url: `/pages/resume/editor?id=${resume.id}` })}
              >
                <CardContent className="p-4">
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center gap-3 flex-1">
                      <View className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <FileText size={22} color="#10B981" />
                      </View>
                      <View className="flex-1">
                        <Text className="block font-semibold text-foreground text-sm">{resume.version_name || '未命名简历'}</Text>
                        <View className="flex flex-row items-center gap-1.5 mt-1">
                          <Calendar size={10} color="#6B7B74" />
                          <Text className="text-muted-foreground text-xs">
                            {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="flex flex-row items-center gap-2">
                      {resume.match_history?.length > 0 && (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-xs">
                          匹配{resume.match_history.length}次
                        </Badge>
                      )}
                      <ChevronRight size={16} color="#B8C2BB" />
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
