import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Flame, Users, ChevronRight, Star, Clock } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

/** 训练场 - 面试模式选择 */
export default function InterviewLobby() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 80)
  }, [])

  const modes = [
    {
      Icon: User,
      title: '单人模拟面',
      desc: 'AI扮演面试官，1对1对话训练',
      type: 'single',
      iconBg: 'bg-primary-container',
      iconColor: '#3A4A44',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      Icon: Flame,
      title: '压力面试',
      desc: '高压追问，锻炼临场反应',
      type: 'stress',
      iconBg: '',
      iconColor: '#E26A5C',
      gradient: 'from-red-500 to-orange-500',
    },
    {
      Icon: Users,
      title: 'AI群面',
      desc: '多位AI面试官轮流提问',
      type: 'group',
      iconBg: '',
      iconColor: '#7C5CFC',
      gradient: 'from-violet-500 to-indigo-600',
    },
  ]

  const trainingRecords = [
    { id: 1, title: '字节跳动·产品经理', score: 82, time: '2小时前', scoreColor: '#5B9A6F' },
    { id: 2, title: '腾讯·前端开发', score: 76, time: '昨天', scoreColor: '#D4A574' },
  ]

  return (
    <View className="min-h-full bg-background">
      {/* 训练概览卡片 */}
      <View className="px-4 pt-3 pb-2">
        <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <View className="h-2" style={{ background: 'linear-gradient(90deg, #E26A5C, #FF6B35, #D4A574)' }} />
          <CardContent className="p-4">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-2">
                <Text className="text-base font-semibold text-foreground">今日已训练</Text>
                <Text className="text-2xl font-bold text-primary">2</Text>
                <Text className="text-sm text-foreground">次</Text>
              </View>
              <View className="w-10 h-10 bg-destructive bg-opacity-15 rounded-xl flex items-center justify-center badge-glow">
                <Flame size={22} color="#E26A5C" />
              </View>
            </View>
            <Text className="block text-xs text-muted-foreground mt-2">坚持训练，面试更从容 💪</Text>
          </CardContent>
        </Card>
      </View>

      {/* 模式选择区域 */}
      <View className="px-4 pt-4 pb-2">
        <Text className={`block text-base font-semibold text-foreground mb-3 ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>选择训练模式</Text>

        {modes.map((mode, idx) => (
          <Card key={mode.type} className={`shadow-card card-hover mb-3 ${loaded ? `anim-fade-in-up anim-delay-${idx + 2}` : 'opacity-0'}`}>
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-3">
                <View
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${mode.gradient}`}
                >
                  <mode.Icon size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex flex-row items-center gap-2">
                    <Text className="block text-base font-semibold text-foreground">{mode.title}</Text>
                    {mode.type === 'stress' && (
                      <View className="px-2 py-1 rounded bg-accent">
                        <Text className="text-xs font-bold text-accent-foreground" style={{ fontSize: '9px' }}>推荐</Text>
                      </View>
                    )}
                  </View>
                  <Text className="block text-sm text-muted-foreground mt-1">{mode.desc}</Text>
                </View>
                <Button
                  className="bg-primary text-primary-foreground rounded-lg px-5 py-3 text-sm font-semibold flex-shrink-0 btn-press"
                  onClick={() => Taro.navigateTo({ url: `/pages/interview/room?type=${mode.type}` })}
                >
                  开始
                </Button>
              </View>
            </CardContent>
          </Card>
        ))}
      </View>

      {/* 最近训练记录 */}
      <View className={`px-4 pt-4 pb-6 ${loaded ? 'anim-fade-in-up anim-delay-5' : 'opacity-0'}`}>
        <Text className="block text-base font-semibold text-foreground mb-3">最近训练</Text>

        <Card className="shadow-card overflow-hidden">
          <CardContent className="p-0">
            {trainingRecords.length > 0 ? trainingRecords.map((record, idx) => (
              <View key={record.id}>
                {idx > 0 && <View className="h-px bg-outline-variant bg-opacity-15 mx-4" />}
                <View
                  className="flex flex-row items-center px-4 py-4 btn-press"
                  onClick={() => Taro.navigateTo({ url: `/pages/interview/report?id=${record.id}` })}
                >
                  <View className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
                    <Star size={18} color="#3A4A44" />
                  </View>
                  <View className="flex-1 min-w-0 ml-3">
                    <Text className="block text-sm font-medium text-foreground truncate">{record.title}</Text>
                    <View className="flex flex-row items-center gap-2 mt-1">
                      <Clock size={10} color="#6B7B74" />
                      <Text className="text-xs text-muted-foreground">{record.time}</Text>
                    </View>
                  </View>
                  <View className="flex flex-col items-center mr-2">
                    <Text className="text-lg font-bold" style={{ color: record.scoreColor }}>{record.score}</Text>
                    <Text className="text-xs text-muted-foreground" style={{ fontSize: '9px' }}>综合评分</Text>
                  </View>
                  <ChevronRight size={14} color="#6B7B7480" />
                </View>
              </View>
            )) : (
              <View className="p-6 flex flex-col items-center">
                <Text className="block text-muted-foreground text-sm">还没有训练记录</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
