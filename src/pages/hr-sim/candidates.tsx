import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import { ArrowLeft, Plus, Pencil, Trash2, ChevronRight, User } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HrCandidate {
  id: string
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
  const [loaded, setLoaded] = useState(false)

  useDidShow(() => {
    setLoaded(false)
    setTimeout(() => setLoaded(true), 80)
    loadCandidates()
  })

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

  const deleteCandidate = async (id: string, e: any) => {
    e.stopPropagation()
    const { confirm } = await Taro.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确认删除该候选人？',
      confirmText: '删除',
      confirmColor: '#EF4444',
    })
    if (!confirm) return

    try {
      await Network.request({ url: `/api/hr-candidates/${id}`, method: 'DELETE' })
      setCandidates(prev => prev.filter(c => c.id !== id))
      Taro.showToast({ title: '删除成功', icon: 'success' })
    } catch (err) {
      Taro.showToast({ title: '删除失败', icon: 'error' })
    }
  }

  const startInterview = (candidate: HrCandidate) => {
    Taro.setStorageSync('hr_selected_candidate', candidate)
    Taro.navigateTo({
      url: `/pages/hr-sim/index?candidateId=${candidate.id}`
    })
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
            <Text className="block text-gray-300 text-xs">
              {candidates.length > 0 ? `共 ${candidates.length} 位候选人` : '创建和管理面试候选人'}
            </Text>
          </View>
          <Button
            size="sm"
            className="bg-accent text-white border-none rounded-lg btn-shimmer btn-press"
            onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/candidate-edit' })}
          >
            <Plus size={14} color="#fff" />
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
          <View className={`${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
            <Card className="shadow-card">
              <CardContent className="p-8 flex flex-col items-center">
                <View
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #EDE9FE, #E0E7FF)' }}
                >
                  <User size={36} color="#C4B5FD" />
                </View>
                <Text className="block text-base font-semibold text-foreground mb-2">
                  还没有候选人
                </Text>
                <Text className="block text-sm text-muted-foreground text-center leading-relaxed mb-5">
                  创建候选人后{'\n'}可以进行HR模拟面试
                </Text>
                <Button
                  className="btn-shimmer btn-press"
                  onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/candidate-edit' })}
                >
                  <Plus size={16} color="#fff" />
                  <Text className="ml-1">创建第一个候选人</Text>
                </Button>
              </CardContent>
            </Card>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {candidates.map((candidate, idx) => (
              <Card
                key={candidate.id}
                className={`shadow-card card-hover ${loaded ? `anim-fade-in-up anim-delay-${Math.min(idx + 1, 5)}` : 'opacity-0'}`}
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
                        <Text className="block font-bold text-foreground text-base">
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
                      onClick={(e: any) => {
                        e.stopPropagation()
                        Taro.navigateTo({ url: `/pages/hr-sim/candidate-edit?id=${candidate.id}` })
                      }}
                    >
                      <Pencil size={14} color="#6B7B74" />
                      <Text className="ml-1">编辑</Text>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="btn-press"
                      onClick={(e: any) => deleteCandidate(candidate.id, e)}
                    >
                      <Trash2 size={14} color="#EF4444" />
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
