import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Building, MapPin, GraduationCap, Plus } from 'lucide-react-taro'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'

/** 副本大厅 - 岗位浏览 */
export default function CompanyHall() {
  const [jobCards, setJobCards] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [loaded, setLoaded] = useState(false)

  const industryFilters = [
    { key: 'all', label: '全部' },
    { key: 'internet', label: '互联网' },
    { key: 'finance', label: '金融' },
    { key: 'education', label: '教育' },
    { key: 'medical', label: '医疗' },
    { key: 'manufacturing', label: '制造业' },
  ]

  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    interested: { label: '攻略中', color: '#5B9A6F', bgColor: 'bg-success bg-opacity-15' },
    applied: { label: '已投递', color: '#6B7B74', bgColor: 'bg-surface-container-high' },
    interviewing: { label: '面试中', color: '#3B82F6', bgColor: '' },
    offer: { label: 'Offer', color: '#5B9A6F', bgColor: 'bg-success bg-opacity-15' },
    rejected: { label: '已结束', color: '#E26A5C', bgColor: 'bg-destructive bg-opacity-15' },
  }

  useDidShow(() => {
    loadJobCards()
    setTimeout(() => setLoaded(true), 80)
  })

  const loadJobCards = async () => {
    try {
      const res = await Network.request({ url: '/api/jobs' })
      console.log('JobCards response:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        setJobCards(res.data.data)
      }
    } catch (err) {
      console.log('Load job cards error:', err)
    } finally {
      // loaded
    }
  }

  const filteredCards = jobCards.filter(c => {
    const matchFilter = filter === 'all' || c.industry === filter || c.status === filter
    const matchSearch = !searchText || (c.company || '').includes(searchText) || (c.position || '').includes(searchText)
    return matchFilter && matchSearch
  })

  return (
    <View className='min-h-full bg-background'>
      {/* 搜索栏 */}
      <View className='px-4 pt-3 pb-3'>
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

      {/* 筛选标签栏 */}
      <View className={`px-4 pb-3 ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
        <View className='flex flex-row gap-2 overflow-x-auto pb-1'>
          {industryFilters.map((item) => (
            <View
              key={item.key}
              className={`flex-shrink-0 px-4 py-2 rounded-full transition-all ${filter === item.key ? 'bg-primary shadow-card' : 'bg-muted'}`}
              onClick={() => setFilter(item.key)}
            >
              <Text className={`text-xs font-semibold ${filter === item.key ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 岗位卡片列表 */}
      {filteredCards.length === 0 ? (
        <View className='px-4'>
          <Card className={`shadow-card ${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}>
            <CardContent className='p-8 flex flex-col items-center'>
              <View className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3' style={{ overflow: 'hidden' }}>
                <Building size={28} color='#B8C2BB' />
              </View>
              <Text className='block text-muted-foreground text-sm font-medium mt-1'>这里还没有你的副本</Text>
              <Text className='block text-muted-foreground text-xs mt-1' style={{ opacity: 0.6 }}>先去发现心仪公司，立下战书吧</Text>
              <View
                className='mt-4 px-5 py-2 bg-primary rounded-full btn-press'
                onClick={() => Taro.navigateTo({ url: '/pages/company/detail?mode=add' })}
              >
                <Text className='text-sm font-semibold text-primary-foreground'>领任务</Text>
              </View>
            </CardContent>
          </Card>
        </View>
      ) : (
        <View className='px-4 flex flex-col gap-3 pb-20'>
          {filteredCards.map((card, idx) => {
            const status = statusMap[card.status] || statusMap.interested
            return (
              <Card
                key={card.id}
                className={`shadow-card card-hover ${loaded ? `anim-fade-in-up anim-delay-${Math.min(idx + 2, 6)}` : 'opacity-0'}`}
                onClick={() => Taro.navigateTo({ url: `/pages/company/detail?id=${card.id}` })}
              >
                <CardContent className='p-4'>
                  {/* 右上角状态标签 */}
                  <View className='absolute top-4 right-4'>
                    <View className={`px-3 py-1 rounded-full ${status.bgColor}`} style={{ backgroundColor: status.bgColor ? undefined : '#DBEAFE' }}>
                      <Text className='text-xs font-semibold' style={{ fontSize: '10px', color: status.color }}>{status.label}</Text>
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
                  </View>
                </CardContent>
              </Card>
            )
          })}
        </View>
      )}

      {/* 底部悬浮按钮 */}
      <View
        className='fixed right-4 bg-primary rounded-full shadow-float px-5 py-3 btn-pulse btn-press'
        style={{ bottom: 80 }}
        onClick={() => Taro.navigateTo({ url: '/pages/company/detail?mode=add' })}
      >
        <View className='flex flex-row items-center gap-2'>
          <Plus size={16} color='#FFFFFF' />
          <Text className='text-sm font-semibold text-primary-foreground'>领任务</Text>
        </View>
      </View>
    </View>
  )
}
