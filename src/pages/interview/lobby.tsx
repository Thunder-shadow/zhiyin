import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Flame, Users, ChevronRight } from 'lucide-react-taro'
import Taro from '@tarojs/taro'

/** 训练场 - 面试模式选择 */
export default function InterviewLobby() {

  const modes = [
    {
      Icon: User,
      title: '单人模拟面',
      desc: 'AI扮演面试官，1对1对话训练',
      type: 'single',
      iconBg: 'bg-primary-container',
      iconColor: '#3A4A44',
    },
    {
      Icon: Flame,
      title: '压力面试',
      desc: '高压追问，锻炼临场反应',
      type: 'stress',
      iconBg: '',
      iconColor: '#E26A5C',
    },
    {
      Icon: Users,
      title: 'AI群面',
      desc: '多位AI面试官轮流提问',
      type: 'group',
      iconBg: '',
      iconColor: '#7C5CFC',
    },
  ]

  const trainingRecords = [
    { id: 1, title: '字节跳动·产品经理', score: 82, time: '2小时前' },
    { id: 2, title: '腾讯·前端开发', score: 76, time: '昨天' },
  ]

  return (
    <View className="min-h-full bg-background">
      {/* 训练概览卡片 */}
      <View className="px-4 pt-2 pb-2">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-2">
                <Text className="text-base font-semibold text-foreground">今日已训练</Text>
                <Text className="text-xl font-bold text-primary">2</Text>
                <Text className="text-sm text-foreground">次</Text>
              </View>
              <View className="w-9 h-9 bg-destructive bg-opacity-15 rounded-lg flex items-center justify-center">
                <Flame size={20} color="#E26A5C" />
              </View>
            </View>
            <Text className="block text-xs text-muted-foreground mt-2">坚持训练，面试更从容</Text>
          </CardContent>
        </Card>
      </View>

      {/* 模式选择区域 */}
      <View className="px-4 pt-4 pb-2">
        <Text className="block text-base font-semibold text-foreground mb-3">选择训练模式</Text>

        {modes.map((mode) => (
          <Card key={mode.type} className="shadow-card mb-3">
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-3">
                <View
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${mode.type === 'single' ? 'bg-primary-container' : mode.type === 'stress' ? '' : ''}`}
                  style={mode.type === 'stress' ? { backgroundColor: 'rgba(226,106,92,0.12)' } : mode.type === 'group' ? { backgroundColor: '#F3E8FF' } : {}}
                >
                  <mode.Icon size={24} color={mode.iconColor} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="block text-base font-semibold text-foreground">{mode.title}</Text>
                  <Text className="block text-sm text-muted-foreground mt-1">{mode.desc}</Text>
                </View>
                <Button
                  className="bg-primary text-primary-foreground rounded-md px-5 py-3 text-sm font-semibold flex-shrink-0"
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
      <View className="px-4 pt-4 pb-6">
        <Text className="block text-base font-semibold text-foreground mb-3">最近训练</Text>

        <Card className="shadow-card overflow-hidden">
          <CardContent className="p-0">
            {trainingRecords.map((record, idx) => (
              <View key={record.id}>
                {idx > 0 && <View className="h-px bg-outline-variant bg-opacity-15 mx-4" />}
                <View
                  className="flex flex-row items-center px-4 py-4"
                  onClick={() => Taro.navigateTo({ url: `/pages/interview/report?id=${record.id}` })}
                >
                  <View className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
                  <View className="flex-1 min-w-0 ml-3">
                    <Text className="block text-sm font-medium text-foreground truncate">{record.title}</Text>
                    <View className="flex flex-row items-center gap-2 mt-1">
                      <Text className="text-xs text-muted-foreground">综合评分</Text>
                      <Text className="text-xs font-semibold text-primary">{record.score}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-muted-foreground mr-2 flex-shrink-0">{record.time}</Text>
                  <ChevronRight size={14} color="#6B7B7480" />
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
