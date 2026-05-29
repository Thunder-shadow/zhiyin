import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Building, MapPin, GraduationCap, Plus, Swords } from 'lucide-react-taro'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'

const statusMap: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  pending: { label: '待挑战', color: '#3B82F6', bgColor: '', icon: '⚔️' },
  interviewing: { label: '面试中', color: '#F59E0B', bgColor: '', icon: '🎤' },
  offer: { label: '已拿Offer', color: '#10B981', bgColor: 'bg-success bg-opacity-15', icon: '🎉' },
  rejected: { label: '已失败', color: '#EF4444', bgColor: 'bg-destructive bg-opacity-15', icon: '😢' },
}

/** 副本大厅 - 任务列表 */
export default function CompanyHall() {
  const [jobCards, setJobCards] = useState<any[]>([])
  const [searchText, setSearchText] = useState('')
  const [loaded, setLoaded] = useState(false)

  useDidShow(() => {
    loadJobCards()
    setTimeout(() => setLoaded(true), 80)
  })

  const loadJobCards = async () => {
    try {
      const res = await Network.request({ url: '/api/jobs' })
      if (res.data?.code === 0 && res.data?.data) {
        setJobCards(res.data.data)
      }
    } catch (err) {
      console.log('Load job cards error:', err)
    }
  }

  const filteredCards = jobCards.filter(c => {
    return !searchText || (c.company || '').includes(searchText) || (c.position || '').includes(searchText)
  })

  const handleCardClick = (card: any) => {
    if (card.status === 'pending' || card.status === 'interviewing') {
      // 进入面试房间
      Taro.navigateTo({ url: `/pages/company/interview-room?jobId=${card.id}` })
    } else {
      // 已完成的面试，查看详情
      Taro.navigateTo({ url: `/pages/company/interview-room?jobId=${card.id}` })
    }
  }

  return (
    <View className='min-h-full bg-background'>
      {/* 搜索栏 */}
      <View style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}>
        <View className={`relative bg-muted rounded-xl ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <View className='absolute left-4 top-1/2 -translate-y-1/2'>
            <Search size={18} color='#6B7B74' />
          </View>
          <View className='pl-10 pr-4 py-3'>
            <Input
              className='w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground placeholder:text-opacity-50'
              placeholder='搜索公司或岗位'
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
            />
          </View>
        </View>
      </View>

      {/* 任务卡片列表 */}
      {filteredCards.length === 0 ? (
        <View style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          <Card className={`shadow-card ${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}>
            <CardContent className='p-8 flex flex-col items-center'>
              <View className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3' style={{ overflow: 'hidden' }}>
                <Building size={28} color='#B8C2BB' />
              </View>
              <Text className='block text-muted-foreground text-sm font-medium mt-1'>还没有副本任务</Text>
              <Text className='block text-muted-foreground text-xs mt-1' style={{ opacity: 0.6 }}>创建你的第一个副本任务，开始面试挑战</Text>
              <View
                className='mt-4 px-5 py-2 bg-primary rounded-full btn-press'
                onClick={() => Taro.navigateTo({ url: '/pages/company/create' })}
              >
                <Text className='text-sm font-semibold text-primary-foreground'>创建任务</Text>
              </View>
            </CardContent>
          </Card>
        </View>
      ) : (
        <View className='flex flex-col gap-3' style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '80px' }}>
          {filteredCards.map((card, idx) => {
            const status = statusMap[card.status] || statusMap.pending
            return (
              <Card
                key={card.id}
                className={`shadow-card card-hover ${loaded ? `anim-fade-in-up anim-delay-${Math.min(idx + 2, 6)}` : 'opacity-0'}`}
                onClick={() => handleCardClick(card)}
              >
                <CardContent className='p-4'>
                  {/* 右上角状态标签 */}
                  <View className='absolute top-4 right-4'>
                    <View className={`px-3 py-1 rounded-full ${status.bgColor}`} style={{ backgroundColor: status.bgColor ? undefined : '#DBEAFE' }}>
                      <Text className='text-xs font-semibold' style={{ fontSize: '10px', color: status.color }}>
                        {status.icon} {status.label}
                      </Text>
                    </View>
                  </View>
                  {/* 公司名称 + 行业标签 */}
                  <View className='flex flex-row items-center gap-2 mb-2'>
                    <Text className='text-sm font-bold text-foreground'>{card.company}</Text>
                    {card.industry && (
                      <View className='px-2 py-1 rounded-full bg-primary-container'>
                        <Text className='text-xs font-medium text-primary' style={{ fontSize: '10px' }}>{card.industry}</Text>
                      </View>
                    )}
                  </View>
                  {/* 岗位名称 */}
                  <Text className='block text-base font-semibold text-foreground mb-2'>{card.position}</Text>
                  {/* 薪资范围 */}
                  {card.salary && (
                    <Text className='block text-sm font-bold text-destructive mb-3'>{card.salary}</Text>
                  )}
                  {/* 底部标签 */}
                  <View className='flex flex-row items-center gap-2'>
                    {card.location && (
                      <View className='flex flex-row items-center gap-1 px-3 py-1 rounded-full bg-muted'>
                        <MapPin size={10} color='#6B7B74' />
                        <Text className='text-xs font-medium text-muted-foreground' style={{ fontSize: '10px' }}>{card.location}</Text>
                      </View>
                    )}
                    {card.education && (
                      <View className='flex flex-row items-center gap-1 px-3 py-1 rounded-full bg-muted'>
                        <GraduationCap size={10} color='#6B7B74' />
                        <Text className='text-xs font-medium text-muted-foreground' style={{ fontSize: '10px' }}>{card.education}</Text>
                      </View>
                    )}
                    {card.interview_rounds && (
                      <View className='flex flex-row items-center gap-1 px-3 py-1 rounded-full bg-muted'>
                        <Swords size={10} color='#6B7B74' />
                        <Text className='text-xs font-medium text-muted-foreground' style={{ fontSize: '10px' }}>{card.interview_rounds}轮</Text>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            )
          })}
        </View>
      )}

      {/* 底部悬浮按钮 - 小圆形 */}
      <View
        style={{
          position: 'fixed',
          right: '16px',
          bottom: '80px',
          width: '48px',
          height: '48px',
          backgroundColor: '#3A4A44',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
        onClick={() => Taro.navigateTo({ url: '/pages/company/create' })}
      >
        <Plus size={22} color='#FFFFFF' />
      </View>
    </View>
  )
}
