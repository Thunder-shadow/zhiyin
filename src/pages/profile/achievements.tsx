import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, ArrowLeft, Star, Flame, Eye, Zap } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

/** 成就中心 - 徽章墙 + 能力成长 */
export default function Achievements() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 80)
  }, [])

  const badgeList = [
    { id: 'first_blood', name: '首次投递', desc: '完成第一次岗位投递', icon: Flame, unlocked: false, color: '#FF6B35' },
    { id: 'talkative', name: '话痨面试官', desc: '面试对话超20轮', icon: Zap, unlocked: false, color: '#3B82F6' },
    { id: 'sharp', name: '简历之刃', desc: '简历匹配分首次超80', icon: Star, unlocked: false, color: '#10B981' },
    { id: 'hr_eye', name: 'HR之眼', desc: '完成HR反向模拟', icon: Eye, unlocked: false, color: '#8B5CF6' },
    { id: 'ten_battles', name: '百战之将', desc: '累计面试10次', icon: Trophy, unlocked: false, color: '#F59E0B' },
  ]

  const titleList = [
    { level: 1, title: '求职新手', minExp: 0, color: '#9CA3AF' },
    { level: 5, title: '简历游侠', minExp: 1600, color: '#3B82F6' },
    { level: 10, title: '面试勇者', minExp: 8100, color: '#8B5CF6' },
    { level: 20, title: 'Offer收割者', minExp: 36100, color: '#FF6B35' },
  ]

  return (
    <View className="min-h-full bg-background">
      {/* 顶部 */}
      <View className="bg-gradient-to-br from-amber-500 to-orange-600 px-4 pt-4 pb-6 rounded-b-3xl">
        <View className="flex flex-row items-center gap-2 mb-2">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <Text className="block text-white font-bold text-lg">成就中心</Text>
        </View>
      </View>

      <View className="px-4 -mt-3">
        {/* 称号进度 */}
        <Card className={`shadow-sm mb-4 ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <CardContent className="p-4">
            <Text className="block font-semibold text-foreground mb-3">称号进阶</Text>
            <View className="flex flex-col gap-2">
              {titleList.map((t, idx) => (
                <View key={t.level} className={`flex flex-row items-center gap-3 ${loaded ? `anim-fade-in-up anim-delay-${idx + 1}` : 'opacity-0'}`}>
                  <View
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${t.color}20` }}
                  >
                    <Text className="text-xs font-bold" style={{ color: t.color }}>{t.level}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="block text-sm text-foreground">{t.title}</Text>
                    <Text className="block text-xs text-gray-400">需要 {t.minExp} EXP</Text>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 徽章墙 */}
        <Text className={`block font-semibold text-foreground mb-3 ${loaded ? 'anim-fade-in-up anim-delay-3' : 'opacity-0'}`}>成就徽章</Text>
        <View className="grid grid-cols-3 gap-3 pb-4">
          {badgeList.map((badge, idx) => (
            <Card
              key={badge.id}
              className={`shadow-sm card-hover ${badge.unlocked ? '' : 'opacity-50'} ${loaded ? `anim-fade-in-scale anim-delay-${idx + 1}` : 'opacity-0'}`}
            >
              <CardContent className="p-3 flex flex-col items-center">
                <View
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${badge.unlocked ? 'badge-glow' : ''}`}
                  style={{ backgroundColor: badge.unlocked ? badge.color : '#E5E7EB' }}
                >
                  <badge.icon size={24} color={badge.unlocked ? '#fff' : '#9CA3AF'} />
                </View>
                <Text className="block text-xs text-foreground font-semibold text-center">{badge.name}</Text>
                <Text className="block text-xs text-gray-400 text-center mt-1">{badge.desc}</Text>
              </CardContent>
            </Card>
          ))}
        </View>
      </View>
    </View>
  )
}
