import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Swords, Mic, Users, Zap } from 'lucide-react-taro'
import Taro from '@tarojs/taro'

/** 训练场 - 面试模式选择 */
export default function InterviewLobby() {
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
    <View className="min-h-full bg-background px-4 pt-4">
      <View className="mb-4">
        <Text className="block text-lg font-bold text-foreground">训练场</Text>
        <Text className="block text-xs text-gray-400 mt-1">选择面试模式，开启Boss战</Text>
      </View>

      <View className="flex flex-col gap-4 pb-4">
        {modes.map((mode) => (
          <Card key={mode.type} className="shadow-sm" onClick={() => Taro.navigateTo({ url: `/pages/interview/room?type=${mode.type}` })}>
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-4">
                <View className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: mode.bgColor }}>
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
      <Card className="shadow-sm border-2 border-dashed border-accent" onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/index' })}>
        <CardContent className="p-4 flex flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <Text className="text-white text-lg">HR</Text>
          </View>
          <View className="flex-1">
            <Text className="block font-bold text-foreground">HR反向模拟</Text>
            <Text className="block text-gray-400 text-xs mt-1">扮演HR面试候选人，打破信息差</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
