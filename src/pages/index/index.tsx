import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, Swords, Briefcase, FileText, Sparkles, LayoutDashboard } from 'lucide-react-taro'
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
  const [loaded, setLoaded] = useState(false)

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
          wins: d.wins || 0,
          interviews: d.interviews || 0,
          resumes: d.resumes || 0,
          streak: d.streak || 0,
        })
      }
    } catch (err) {
      console.log('Load game state error:', err)
    } finally {
      setTimeout(() => setLoaded(true), 100)
    }
  }

  const expPercent = gameState.exp_to_next > 0
    ? Math.min(Math.round((gameState.exp / gameState.exp_to_next) * 100), 100)
    : 0

  const funnelStages = [
    { label: '投递', count: gameState.total_battles, color: '#FF6B35' },
    { label: '面试', count: gameState.interviews, color: '#3B82F6' },
    { label: 'Offer', count: gameState.wins, color: '#10B981' },
  ]

  const quickActions = [
    { label: '职业沙盘', path: '/pages/plan/sandbox', icon: Sparkles, color: '#8B5CF6', desc: 'AI帮你规划' },
    { label: '副本大厅', path: '/pages/company/hall', icon: Briefcase, color: '#3B82F6', desc: '浏览岗位' },
    { label: '训练场', path: '/pages/interview/lobby', icon: Swords, color: '#FF6B35', desc: '模拟面试' },
    { label: '简历库', path: '/pages/resume/list', icon: FileText, color: '#10B981', desc: '管理简历' },
  ]

  return (
    <View className="min-h-full bg-background">
      {/* 顶部深色区 - 用户信息 + 等级 */}
      <View className="bg-primary px-4 pt-6 pb-8 rounded-b-3xl">
        <View className={`flex flex-row items-center gap-3 mb-4 ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <View className="w-12 h-12 rounded-full bg-accent flex items-center justify-center badge-glow">
            <Text className="text-white text-lg font-bold">{gameState.title[0]}</Text>
          </View>
          <View>
            <Text className="block text-white font-bold text-lg">求职冒险者</Text>
            <View className="flex flex-row items-center gap-2 mt-1">
              <Badge className="bg-accent text-white border-none text-xs">Lv.{gameState.level}</Badge>
              <Text className="text-accent text-sm">{gameState.title}</Text>
            </View>
          </View>
        </View>
        {/* 经验条 */}
        <View className={`${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
          <View className="flex flex-row justify-between mb-1">
            <Text className="text-gray-300 text-xs">EXP {gameState.exp}/{gameState.exp_to_next}</Text>
            <Text className="text-gray-300 text-xs">{expPercent}%</Text>
          </View>
          <Progress value={expPercent} className="h-2 bg-primary bg-opacity-80" />
        </View>
        {gameState.streak > 0 && (
          <View className={`mt-2 ${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}>
            <Badge className="bg-amber-500 text-white border-none text-xs badge-glow">连续活跃 {gameState.streak} 天</Badge>
          </View>
        )}
      </View>

      {/* 漏斗看板 */}
      <View className={`px-4 -mt-4 ${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}>
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <Text className="block font-semibold text-foreground mb-3">求职漏斗</Text>
            <View className="flex flex-col gap-2">
              {funnelStages.map((stage, idx) => (
                <View key={stage.label} className={`flex flex-row items-center gap-3 ${loaded ? `anim-fade-in-up anim-delay-${idx + 3}` : ''}`}>
                  <Text className="block text-sm text-gray-500 w-10">{stage.label}</Text>
                  <View className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full progress-animated"
                      style={{
                        width: `${funnelStages[0].count > 0 ? Math.max(Math.round((stage.count / funnelStages[0].count) * 100), 8) : 8}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </View>
                  <Text className="block font-mono text-sm text-foreground w-8 text-right">{stage.count}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 快捷入口 */}
      <View className={`px-4 mt-4 ${loaded ? 'anim-fade-in-up anim-delay-3' : 'opacity-0'}`}>
        <Text className="block font-semibold text-foreground mb-3">快捷入口</Text>
        <View className="grid grid-cols-4 gap-3">
          {quickActions.map((action, idx) => (
            <View
              key={action.label}
              className={`flex flex-col items-center gap-1 icon-entrance ${loaded ? `anim-fade-in-scale anim-delay-${idx + 2}` : 'opacity-0'}`}
              onClick={() => Taro.navigateTo({ url: action.path })}
            >
              <View
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <action.icon size={24} color={action.color} />
              </View>
              <Text className="block text-xs text-foreground font-semibold">{action.label}</Text>
              <Text className="block text-xs text-gray-400">{action.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 底部导航入口 */}
      <View className={`px-4 mt-6 pb-4 ${loaded ? 'anim-fade-in-up anim-delay-5' : 'opacity-0'}`}>
        <Card className="shadow-sm card-hover" onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/index' })}>
          <CardContent className="p-4">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center btn-shimmer">
                  <LayoutDashboard size={20} color="#fff" />
                </View>
                <View>
                  <Text className="block font-semibold text-foreground">HR反向模拟</Text>
                  <Text className="block text-xs text-gray-400">扮演HR面试候选人，训练选人眼光</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#D1D5DB" />
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
