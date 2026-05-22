import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, ChevronRight, ArrowLeft } from 'lucide-react-taro'
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
      <View className="bg-gradient-to-br from-emerald-500 to-teal-600 px-4 pt-4 pb-6 rounded-b-3xl">
        <View className="flex flex-row items-center gap-2 mb-2">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="block text-white font-bold text-lg">简历库</Text>
            <Text className="block text-emerald-200 text-xs mt-1">管理你的简历，AI优化匹配</Text>
          </View>
          <Button
            size="sm"
            className="bg-accent text-white border-none rounded-lg btn-shimmer"
            onClick={() => Taro.navigateTo({ url: '/pages/resume/editor?mode=add' })}
          >
            <Plus size={14} color="#fff" />
            <Text className="text-white ml-1">新建</Text>
          </Button>
        </View>
      </View>

      <View className="px-4 -mt-3">
        {resumes.length === 0 ? (
          <Card className={`shadow-sm ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
            <CardContent className="p-8 flex flex-col items-center">
              <FileText size={40} color="#D1D5DB" />
              <Text className="block text-gray-400 text-sm mt-3">还没有简历</Text>
              <Text className="block text-gray-300 text-xs mt-1">上传或创建简历，开启AI优化之旅</Text>
            </CardContent>
          </Card>
        ) : (
          <View className="flex flex-col gap-3 pb-4">
            {resumes.map((resume, idx) => (
              <Card
                key={resume.id}
                className={`shadow-sm card-hover ${loaded ? `anim-fade-in-up anim-delay-${Math.min(idx + 1, 5)}` : 'opacity-0'}`}
                onClick={() => Taro.navigateTo({ url: `/pages/resume/editor?id=${resume.id}` })}
              >
                <CardContent className="p-4">
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center gap-3 flex-1">
                      <View className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <FileText size={20} color="#10B981" />
                      </View>
                      <View className="flex-1">
                        <Text className="block font-semibold text-foreground text-sm">{resume.version_name || '未命名简历'}</Text>
                        <Text className="block text-gray-400 text-xs mt-1">
                          {resume.created_at ? new Date(resume.created_at).toLocaleDateString() : ''}
                        </Text>
                      </View>
                    </View>
                    <View className="flex flex-row items-center gap-2">
                      {resume.match_history?.length > 0 && (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-xs">
                          匹配{resume.match_history.length}次
                        </Badge>
                      )}
                      <ChevronRight size={16} color="#D1D5DB" />
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
