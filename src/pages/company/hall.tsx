import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, Plus, ChevronRight, ArrowLeft } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

/** 副本大厅 - 目标公司看板 */
export default function CompanyHall() {
  const [jobCards, setJobCards] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loaded, setLoaded] = useState(false)

  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    interested: { label: '攻略中', color: '#3B82F6', bgColor: '#EFF6FF' },
    applied: { label: '已投递', color: '#F59E0B', bgColor: '#FFFBEB' },
    interviewing: { label: '面试中', color: '#8B5CF6', bgColor: '#F5F3FF' },
    offer: { label: '胜利', color: '#10B981', bgColor: '#ECFDF5' },
    rejected: { label: '失败', color: '#EF4444', bgColor: '#FEF2F2' },
  }

  useEffect(() => {
    loadJobCards()
  }, [])

  const loadJobCards = async () => {
    try {
      const res = await Network.request({ url: '/api/job-cards' })
      console.log('JobCards response:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        setJobCards(res.data.data)
      }
    } catch (err) {
      console.log('Load job cards error:', err)
    } finally {
      setTimeout(() => setLoaded(true), 80)
    }
  }

  const filteredCards = filter === 'all' ? jobCards : jobCards.filter(c => c.status === filter)

  return (
    <View className="min-h-full bg-background">
      {/* 顶部 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-700 px-4 pt-4 pb-6 rounded-b-3xl">
        <View className="flex flex-row items-center gap-2 mb-3">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="block text-white font-bold text-lg">副本大厅</Text>
            <Text className="block text-blue-200 text-xs mt-1">攻略心仪公司，拿下Offer</Text>
          </View>
          <Button
            size="sm"
            className="bg-accent text-white border-none rounded-lg btn-shimmer"
            onClick={() => Taro.navigateTo({ url: '/pages/company/detail?mode=add' })}
          >
            <Plus size={14} color="#fff" />
            <Text className="text-white ml-1">添加</Text>
          </Button>
        </View>
      </View>

      <View className="px-4 -mt-3">
        {/* 状态过滤标签 */}
        <View className="flex flex-row gap-2 mb-4 overflow-x-auto">
          <View
            className={`px-3 py-2 rounded-full shadow-sm ${filter === 'all' ? 'bg-primary' : 'bg-white'} ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}
            onClick={() => setFilter('all')}
          >
            <Text className={`text-xs ${filter === 'all' ? 'text-white' : 'text-gray-500'}`}>全部</Text>
          </View>
          {Object.entries(statusMap).map(([key, val], idx) => (
            <View
              key={key}
              className={`px-3 py-2 rounded-full shadow-sm ${filter === key ? 'bg-primary' : 'bg-white'} ${loaded ? `anim-fade-in-up anim-delay-${idx + 1}` : 'opacity-0'}`}
              onClick={() => setFilter(key)}
            >
              <Text className={`text-xs ${filter === key ? 'text-white' : 'text-gray-500'}`}>{val.label}</Text>
            </View>
          ))}
        </View>

        {/* 公司卡片列表 */}
        {filteredCards.length === 0 ? (
          <Card className={`shadow-sm ${loaded ? 'anim-fade-in-up anim-delay-3' : 'opacity-0'}`}>
            <CardContent className="p-8 flex flex-col items-center">
              <Building size={40} color="#D1D5DB" />
              <Text className="block text-gray-400 text-sm mt-3">这里还没有你的副本</Text>
              <Text className="block text-gray-300 text-xs mt-1">先去发现心仪公司，立下战书吧</Text>
            </CardContent>
          </Card>
        ) : (
          <View className="flex flex-col gap-3 pb-4">
            {filteredCards.map((card, idx) => {
              const status = statusMap[card.status] || statusMap.interested
              return (
                <Card
                  key={card.id}
                  className={`shadow-sm card-hover ${loaded ? `anim-fade-in-up anim-delay-${Math.min(idx + 1, 5)}` : 'opacity-0'}`}
                  onClick={() => Taro.navigateTo({ url: `/pages/company/detail?id=${card.id}` })}
                >
                  <CardContent className="p-4">
                    <View className="flex flex-row items-center justify-between">
                      <View className="flex flex-row items-center gap-3 flex-1">
                        <View className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 btn-shimmer">
                          <Text className="text-white text-sm font-bold">{(card.company || '?')[0]}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="block font-semibold text-foreground text-sm">{card.company}</Text>
                          <Text className="block text-gray-400 text-xs mt-1">{card.position}</Text>
                        </View>
                      </View>
                      <View className="flex flex-row items-center gap-2">
                        <Badge className="text-xs border-none" style={{ backgroundColor: status.bgColor, color: status.color }}>
                          {status.label}
                        </Badge>
                        <ChevronRight size={16} color="#D1D5DB" />
                      </View>
                    </View>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </View>
    </View>
  )
}
