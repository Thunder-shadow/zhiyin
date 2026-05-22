import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, ChevronLeft, Star, Flame, Eye, Zap } from 'lucide-react-taro'
import Taro from '@tarojs/taro'

/** 成就中心 - 徽章墙 + 能力成长 */
export default function Achievements() {
  const badgeList = [
    { id: 'first_blood', name: '首次投递', desc: '完成第一次岗位投递', icon: Flame, unlocked: false },
    { id: 'talkative', name: '话痨面试官', desc: '面试对话超20轮', icon: Zap, unlocked: false },
    { id: 'sharp', name: '简历之刃', desc: '简历匹配分首次超80', icon: Star, unlocked: false },
    { id: 'hr_eye', name: 'HR之眼', desc: '完成HR反向模拟', icon: Eye, unlocked: false },
    { id: 'ten_battles', name: '百战之将', desc: '累计面试10次', icon: Trophy, unlocked: false },
  ]

  const titleList = [
    { level: 1, title: '求职新手', minExp: 0 },
    { level: 5, title: '简历游侠', minExp: 1600 },
    { level: 10, title: '面试勇者', minExp: 8100 },
    { level: 20, title: 'Offer收割者', minExp: 36100 },
  ]

  return (
    <View className="min-h-full bg-background px-4 pt-4 pb-8">
      <View className="flex flex-row items-center gap-2 mb-4" onClick={() => Taro.navigateBack()}>
        <ChevronLeft size={20} color="#1A2B4C" />
        <Text className="block font-bold text-lg text-foreground">成就中心</Text>
      </View>

      {/* 称号进度 */}
      <Card className="shadow-sm mb-4">
        <CardContent className="p-4">
          <Text className="block font-semibold text-foreground mb-3">称号进阶</Text>
          <View className="flex flex-col gap-2">
            {titleList.map((t) => (
              <View key={t.level} className="flex flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Text className="text-accent text-xs font-bold">{t.level}</Text>
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
      <Text className="block font-semibold text-foreground mb-3">成就徽章</Text>
      <View className="grid grid-cols-3 gap-3">
        {badgeList.map((badge) => (
          <Card key={badge.id} className={`shadow-sm ${badge.unlocked ? '' : 'opacity-50'}`}>
            <CardContent className="p-3 flex flex-col items-center">
              <View className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${badge.unlocked ? 'bg-accent' : 'bg-gray-200'}`}>
                <badge.icon size={24} color={badge.unlocked ? '#fff' : '#9CA3AF'} />
              </View>
              <Text className="block text-xs text-foreground font-semibold text-center">{badge.name}</Text>
              <Text className="block text-xs text-gray-400 text-center mt-1">{badge.desc}</Text>
            </CardContent>
          </Card>
        ))}
      </View>
    </View>
  )
}
