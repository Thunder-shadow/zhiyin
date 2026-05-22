import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Swords, FileText, Building, Map, Trophy, TrendingUp, Target, ChevronRight } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

/** 游戏驾驶舱首页 */
export default function Dashboard() {
  const [userInfo, setUserInfo] = useState({
    nick_name: '冒险者',
    level: 1,
    exp: 0,
    title: '求职新手',
  })
  const [stats, setStats] = useState({ applied: 0, interviewing: 0, offered: 0 })

  // 经验条百分比（Level = floor(sqrt(EXP/100)) + 1）
  const expForCurrentLevel = Math.pow(userInfo.level - 1, 2) * 100
  const expForNextLevel = Math.pow(userInfo.level, 2) * 100
  const expPercent = userInfo.level <= 1
    ? Math.min((userInfo.exp / 100) * 100, 100)
    : Math.min(((userInfo.exp - expForCurrentLevel) / (expForNextLevel - expForCurrentLevel)) * 100, 100)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const res = await Network.request({ url: '/api/dashboard' })
      console.log('Dashboard response:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        const d = res.data.data
        setUserInfo({
          nick_name: d.user?.nick_name || '冒险者',
          level: d.user?.level || 1,
          exp: d.user?.exp || 0,
          title: d.user?.title || '求职新手',
        })
        setStats({
          applied: d.stats?.applied || 0,
          interviewing: d.stats?.interviewing || 0,
          offered: d.stats?.offered || 0,
        })
      }
    } catch (err) {
      console.log('Dashboard load error:', err)
    }
  }

  const quickEntries = [
    { icon: Map, label: 'AI规划', path: '/pages/plan/sandbox', color: '#FF6B35' },
    { icon: FileText, label: '简历库', path: '/pages/resume/list', color: '#3B82F6' },
    { icon: Building, label: '我的副本', path: '/pages/company/hall', color: '#10B981' },
    { icon: Swords, label: '训练场', path: '/pages/interview/lobby', color: '#8B5CF6' },
  ]

  return (
    <View className="min-h-full bg-background">
      {/* 顶部深蓝区域：用户信息 + 经验条 */}
      <View className="bg-primary px-4 pt-6 pb-8 rounded-b-3xl">
        <View className="flex flex-row items-center justify-between mb-4">
          <View className="flex flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <Text className="text-white text-lg font-bold">{userInfo.nick_name[0]}</Text>
            </View>
            <View>
              <Text className="block text-white font-bold text-lg">{userInfo.nick_name}</Text>
              <View className="flex flex-row items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-orange-500 text-white border-none text-xs">
                  Lv.{userInfo.level}
                </Badge>
                <Text className="text-accent text-xs">{userInfo.title}</Text>
              </View>
            </View>
          </View>
          <Trophy size={24} color="#FFB347" />
        </View>
        {/* 经验条 */}
        <View>
          <View className="flex flex-row items-center justify-between mb-1">
            <Text className="text-gray-300 text-xs">EXP</Text>
            <Text className="text-accent text-xs font-mono">{userInfo.exp} / {expForNextLevel}</Text>
          </View>
          <View className="w-full h-2 bg-primary bg-opacity-80 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${expPercent}%`,
                background: 'linear-gradient(90deg, #FF6B35, #FFB347)',
                transition: 'width 0.5s ease-in-out',
              }}
            />
          </View>
        </View>
      </View>

      {/* 漏斗视图：投递 → 面试 → Offer */}
      <View className="px-4 -mt-4">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="block font-semibold text-foreground">求职漏斗</Text>
              <TrendingUp size={16} color="#6B7280" />
            </View>
            <View className="flex flex-row items-center justify-around">
              <View className="flex flex-col items-center">
                <View className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-1">
                  <Text className="block text-blue-500 font-bold text-xl font-mono">{stats.applied}</Text>
                </View>
                <Text className="block text-gray-500 text-xs">已投递</Text>
              </View>
              <View className="flex flex-col items-center">
                <View className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-1">
                  <Text className="block text-purple-500 font-bold text-xl font-mono">{stats.interviewing}</Text>
                </View>
                <Text className="block text-gray-500 text-xs">面试中</Text>
              </View>
              <View className="flex flex-col items-center">
                <View className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-1">
                  <Text className="block text-emerald-500 font-bold text-xl font-mono">{stats.offered}</Text>
                </View>
                <Text className="block text-gray-500 text-xs">已收获</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 快捷入口 */}
      <View className="px-4 mt-4">
        <Text className="block font-semibold text-foreground mb-3">快捷入口</Text>
        <View className="grid grid-cols-4 gap-3">
          {quickEntries.map((entry) => (
            <View
              key={entry.label}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm"
              onClick={() => Taro.navigateTo({ url: entry.path })}
            >
              <View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${entry.color}15` }}>
                <entry.icon size={22} color={entry.color} />
              </View>
              <Text className="block text-xs text-gray-600">{entry.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 最近行动 */}
      <View className="px-4 mt-4 pb-4">
        <View className="flex flex-row items-center justify-between mb-3">
          <Text className="block font-semibold text-foreground">最近行动</Text>
          <View className="flex flex-row items-center" onClick={() => Taro.switchTab({ url: '/pages/company/hall' })}>
            <Text className="text-xs text-gray-400">查看全部</Text>
            <ChevronRight size={14} color="#9CA3AF" />
          </View>
        </View>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center min-h-24">
            <Target size={32} color="#D1D5DB" />
            <Text className="block text-gray-400 text-sm mt-2">还没有行动记录</Text>
            <Text className="block text-gray-300 text-xs mt-1">去发现心仪公司，立下战书吧</Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
