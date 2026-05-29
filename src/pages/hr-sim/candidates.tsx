/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, User, Pencil, Trash2, Swords, Search } from 'lucide-react-taro'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'

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

export default function Candidates() {
  const router = useRouter()
  const mode = router.params.mode || 'manage'
  const isSelectMode = mode === 'select'

  const [candidates, setCandidates] = useState<HrCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')

  // 每次页面显示时刷新数据
  useDidShow(() => {
    loadCandidates()
  })

  const loadCandidates = async () => {
    try {
      setLoading(true)
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

  /** 开始面试 */
  const startInterview = (candidate: HrCandidate) => {
    Taro.navigateTo({
      url: `/pages/hr-sim/index?candidateId=${candidate.id}&candidateName=${encodeURIComponent(candidate.name)}&candidateSchool=${encodeURIComponent(candidate.school)}&candidateMajor=${encodeURIComponent(candidate.major)}&candidateBackground=${encodeURIComponent(candidate.background)}&candidatePersonality=${encodeURIComponent(candidate.personality)}&candidateRealLevel=${encodeURIComponent(candidate.real_level)}&candidateColor=${encodeURIComponent(candidate.color || '#8B5CF6')}`
    })
  }

  /** 跳转创建候选人 */
  const goToCreate = () => {
    Taro.navigateTo({ url: '/pages/hr-sim/candidate-edit' })
  }

  /** 跳转编辑候选人 */
  const goToEdit = (id: string) => {
    Taro.navigateTo({ url: `/pages/hr-sim/candidate-edit?id=${id}` })
  }

  /** 删除候选人 */
  const deleteCandidate = (candidate: HrCandidate) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除候选人「${candidate.name}」吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#E26A5C',
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/hr-candidates/${candidate.id}`,
              method: 'DELETE'
            })
            Taro.showToast({ title: '删除成功', icon: 'success' })
            loadCandidates()
          } catch (err) {
            console.error('Delete error:', err)
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  // 过滤候选人
  const filteredCandidates = candidates.filter(c => {
    if (!searchKeyword) return true
    const keyword = searchKeyword.toLowerCase()
    return (
      c.name.toLowerCase().includes(keyword) ||
      c.school.toLowerCase().includes(keyword) ||
      c.major.toLowerCase().includes(keyword)
    )
  })

  return (
    <View className='min-h-full bg-background pb-safe'>
      {/* 顶部 */}
      <View
        className='rounded-b-2xl relative overflow-hidden'
        style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '16px', paddingTop: '16px', background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)' }}
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

      <View style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}>
        {/* 新建候选人按钮 - 仅管理模式显示 */}
        {!isSelectMode && (
          <Button className='w-full btn-shimmer btn-press mb-4' onClick={goToCreate}>
            <Plus size={16} color='#fff' />
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

        {loading ? (
          <View className='flex flex-col items-center py-16'>
            <Text className='block text-sm text-muted-foreground'>加载中...</Text>
          </View>
        ) : filteredCandidates.length === 0 ? (
          <View>
            {searchKeyword ? (
              <Card className='shadow-card'>
                <CardContent className='p-8 flex flex-col items-center'>
                  <View
                    className='w-16 h-16 rounded-full flex items-center justify-center mb-4'
                    style={{ background: 'linear-gradient(135deg, #EDE9FE, #E0E7FF)' }}
                  >
                    <Search size={28} color='#C4B5FD' />
                  </View>
                  <Text className='block text-base font-semibold text-foreground mb-2'>未找到候选人</Text>
                  <Text className='block text-sm text-muted-foreground text-center'>
                    换个关键词试试
                  </Text>
                </CardContent>
              </Card>
            ) : (
              <Card className='shadow-card'>
                <CardContent className='p-8 flex flex-col items-center'>
                  <View
                    className='w-20 h-20 rounded-full flex items-center justify-center mb-4'
                    style={{ background: 'linear-gradient(135deg, #EDE9FE, #E0E7FF)' }}
                  >
                    <User size={36} color='#C4B5FD' />
                  </View>
                  <Text className='block text-base font-semibold text-foreground mb-2'>还没有候选人</Text>
                  <Text className='block text-sm text-muted-foreground text-center leading-relaxed mb-5'>
                    先创建候选人，再开始面试
                  </Text>
                  <Button className='btn-shimmer btn-press' onClick={goToCreate}>
                    <Plus size={16} color='#fff' />
                    <Text className='ml-1'>创建候选人</Text>
                  </Button>
                </CardContent>
              </Card>
            )}
          </View>
        ) : (
          <View>
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className='mb-3 shadow-card'>
                <CardContent className='p-4'>
                  <View className='flex flex-row items-center gap-3'>
                    <View
                      className='w-12 h-12 rounded-xl flex items-center justify-center'
                      style={{ backgroundColor: `${candidate.color || '#8B5CF6'}15` }}
                    >
                      <User size={24} color={candidate.color || '#8B5CF6'} />
                    </View>
                    <View className='flex-1'>
                      <View className='flex flex-row items-center gap-2'>
                        <Text className='block font-semibold text-foreground'>{candidate.name}</Text>
                        {candidate.tag && (
                          <Badge
                            className='text-xs border-none'
                            style={{
                              backgroundColor: `${candidate.color || '#8B5CF6'}15`,
                              color: candidate.color || '#8B5CF6',
                            }}
                          >
                            {candidate.tag}
                          </Badge>
                        )}
                      </View>
                      <Text className='block text-xs text-muted-foreground mt-1'>
                        {candidate.school} · {candidate.major}
                      </Text>
                    </View>
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
