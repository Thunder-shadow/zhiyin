import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight, Swords, Building, FileText, Sparkles, LayoutDashboard, Flame } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

/** 游戏驾驶舱 - 首页 */
export default function Index() {
  const [gameState, setGameState] = useState({
    level: 1,
    exp: 0,
    exp_to_next: 100,
    title: '求职新手',
    total_battles: 0,
    wins: 0,
    interviews: 0,
    resumes: 0,
    streak: 0,
  })

  useEffect(() => {
    loadGameState()
  }, [])

  const loadGameState = async () => {
    try {
      const res = await Network.request({ url: '/api/user/profile' })
      console.log('Dashboard game state:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        const d = res.data.data
        setGameState({
          level: d.level || 1,
          exp: d.exp || 0,
          exp_to_next: d.exp_to_next || 100,
          title: d.title || '求职新手',
          total_battles: d.total_battles || 0,
          interviews: d.interviews || 0,
          wins: d.wins || 0,
          resumes: d.resumes || 0,
          streak: d.streak || 0,
        })
      }
    } catch (err) {
      console.log('Load game state error:', err)
    } finally {
      // loaded
    }
  }

  const expPercent = gameState.exp_to_next > 0
    ? Math.min(Math.round((gameState.exp / gameState.exp_to_next) * 100), 100)
    : 0

  const funnelStages = [
    { label: '投递', count: gameState.total_battles, color: 'bg-funnel-deliver' },
    { label: '面试', count: gameState.interviews, color: 'bg-funnel-interview' },
    { label: 'Offer', count: gameState.wins, color: 'bg-funnel-offer' },
  ]

  const quickActions = [
    { label: '职业沙盘', path: '/pages/plan/sandbox', Icon: Sparkles, bg: 'bg-entry-sandbox-bg', iconBg: 'bg-entry-sandbox-icon-bg', iconColor: '#7C5CFC', desc: 'AI帮你规划' },
    { label: '副本大厅', path: '/pages/company/hall', Icon: Building, bg: 'bg-entry-dungeon-bg', iconBg: 'bg-entry-dungeon-icon-bg', iconColor: '#3A4A44', desc: '浏览岗位' },
    { label: '训练场', path: '/pages/interview/lobby', Icon: Swords, bg: 'bg-entry-training-bg', iconBg: 'bg-entry-training-icon-bg', iconColor: '#E8864A', desc: '模拟面试' },
    { label: '简历库', path: '/pages/resume/list', Icon: FileText, bg: 'bg-entry-resume-bg', iconBg: 'bg-entry-resume-icon-bg', iconColor: '#A89060', desc: '管理简历' },
  ]

  return (
    <View className="min-h-full bg-background">
      {/* 1. 用户概览区 */}
      <View className="px-4 pt-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-3">
              {/* 头像圆圈 */}
              <View className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Text className="text-lg font-bold text-primary-foreground">{gameState.title[0]}</Text>
              </View>
              {/* 中间信息 */}
              <View className="flex-1 min-w-0">
                <View className="flex flex-row items-center gap-2">
                  <Text className="text-base font-semibold text-foreground">小初</Text>
                  <View className="px-2 py-1 rounded bg-primary bg-opacity-15">
                    <Text className="text-xs font-bold text-primary">Lv.{gameState.level}</Text>
                  </View>
                </View>
                <Text className="block text-sm text-muted-foreground mt-1">称号：{gameState.title}</Text>
                {/* 经验进度条 */}
                <View className="flex flex-row items-center gap-2 mt-2">
                  <View className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${expPercent}%`, background: 'linear-gradient(90deg, #3A4A44, #D4A574)' }}
                    />
                  </View>
                  <Text className="text-xs text-muted-foreground whitespace-nowrap">{gameState.exp}/{gameState.exp_to_next} EXP</Text>
                </View>
              </View>
              {/* 右侧连续活跃徽章 */}
              {gameState.streak > 0 && (
                <View className="flex-shrink-0 flex flex-col items-center gap-1">
                  <View className="flex flex-row items-center px-2 py-1 rounded-lg bg-warning bg-opacity-20">
                    <Flame size={14} color="#D4A574" />
                    <Text className="text-xs font-semibold text-warning ml-1">{gameState.streak}天</Text>
                  </View>
                  <Text className="text-xs text-muted-foreground" style={{ fontSize: '10px' }}>连续活跃</Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 2. 求职漏斗看板 */}
      <View className="px-4 mt-5">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <Text className="block text-base font-semibold text-foreground mb-3">求职漏斗</Text>
            {funnelStages.map((stage) => (
              <View key={stage.label} className="flex flex-row items-center gap-3 mb-3 last:mb-0">
                <Text className={`text-sm font-medium w-10 text-right ${stage.color === 'bg-funnel-deliver' ? 'text-funnel-deliver' : stage.color === 'bg-funnel-interview' ? 'text-funnel-interview' : 'text-funnel-offer'}`}>{stage.label}</Text>
                <View className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${stage.color}`}
                    style={{ width: `${funnelStages[0].count > 0 ? Math.max(Math.round((stage.count / funnelStages[0].count) * 100), 8) : 8}%` }}
                  />
                </View>
                <Text className="block text-base font-bold text-foreground w-6 text-right">{stage.count}</Text>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      {/* 3. 快捷入口 2x2 */}
      <View className="px-4 mt-5">
        <View className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Card
              key={action.label}
              className={`shadow-card ${action.bg}`}
              onClick={() => Taro.switchTab({ url: action.path })}
            >
              <CardContent className="p-4">
                <View className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.iconBg}`}>
                  <action.Icon size={20} color={action.iconColor} />
                </View>
                <Text className="block text-sm font-semibold text-foreground mt-2">{action.label}</Text>
                <Text className="block text-xs text-muted-foreground mt-1">{action.desc}</Text>
              </CardContent>
            </Card>
          ))}
        </View>
      </View>

      {/* 4. HR反向模拟入口 */}
      <View className="px-4 mt-5 pb-4">
        <Card
          className="shadow-card"
          onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/index' })}
        >
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-3">
              <View className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0">
                <LayoutDashboard size={20} color="#3A4A44" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="block text-sm font-semibold text-foreground">HR反向模拟</Text>
                <Text className="block text-xs text-muted-foreground mt-1">扮演HR面试候选人，训练选人眼光</Text>
              </View>
              <ChevronRight size={20} color="#6B7B74" />
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
