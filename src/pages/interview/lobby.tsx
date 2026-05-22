import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Swords, Mic, Users, Zap, ArrowLeft, Sparkles } from 'lucide-react-taro'
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
      icon: Mic,
      title: '单面模拟',
      desc: '行为面试 / 案例面试，AI面试官一对一',
      type: 'single',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
    },
    {
      icon: Zap,
      title: '压力面试',
      desc: '高强度追问，锻炼抗压与临场应变',
      type: 'stress',
      color: '#EF4444',
      bgColor: '#FEF2F2',
    },
    {
      icon: Users,
      title: 'AI群面模拟',
      desc: '多角色群面，体验无领导小组讨论',
      type: 'group',
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
    },
  ]

  return (
    <View className="min-h-full bg-background">
      {/* 顶部 */}
      <View className="bg-gradient-to-br from-primary to-indigo-700 px-4 pt-4 pb-6 rounded-b-3xl">
        <View className="flex flex-row items-center gap-2 mb-3">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="block text-white font-bold text-lg">训练场</Text>
            <Text className="block text-indigo-200 text-xs mt-1">选择面试模式，开启Boss战</Text>
          </View>
          <View className="w-10 h-10 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
            <Swords size={22} color="#fff" />
          </View>
        </View>
      </View>

      <View className="px-4 -mt-3">
        {/* 模式卡片 */}
        <View className="flex flex-col gap-3 pb-4">
          {modes.map((mode, idx) => (
            <Card
              key={mode.type}
              className={`shadow-md card-hover ${loaded ? `anim-fade-in-up anim-delay-${idx + 1}` : 'opacity-0'}`}
              onClick={() => Taro.navigateTo({ url: `/pages/interview/room?type=${mode.type}` })}
            >
              <CardContent className="p-4">
                <View className="flex flex-row items-center gap-4">
                  <View
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 btn-shimmer"
                    style={{ backgroundColor: mode.bgColor }}
                  >
                    <mode.icon size={28} color={mode.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="block font-bold text-foreground text-base">{mode.title}</Text>
                    <Text className="block text-gray-400 text-xs mt-1">{mode.desc}</Text>
                  </View>
                  <Swords size={20} color="#D1D5DB" />
                </View>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* HR反向模拟入口 */}
        <Card
          className={`shadow-sm border-2 border-dashed border-violet-300 card-hover ${loaded ? 'anim-fade-in-up anim-delay-4' : 'opacity-0'}`}
          onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/index' })}
        >
          <CardContent className="p-4 flex flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0 btn-shimmer">
              <Sparkles size={18} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="block font-bold text-foreground">HR反向模拟</Text>
              <Text className="block text-gray-400 text-xs mt-1">扮演HR面试候选人，打破信息差</Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
