import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Sparkles, Swords, BookOpen, Settings, ChevronRight, Footprints, Mic, Send, Trophy, ClipboardList } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

/** 我的 - 个人中心 */
export default function Profile() {
  const [userInfo, setUserInfo] = useState({
    nick_name: '冒险者',
    level: 1,
    exp: 0,
    title: '求职新手',
    total_battles: 0,
    interviews: 0,
    wins: 0,
    badges: [] as string[],
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadProfile()
    setTimeout(() => setLoaded(true), 80)
  }, [])

  const loadProfile = async () => {
    try {
      const res = await Network.request({ url: '/api/user/profile' })
      console.log('Profile response:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        const d = res.data.data
        setUserInfo({
          nick_name: d.nick_name || '冒险者',
          level: d.level || 1,
          exp: d.exp || 0,
          title: d.title || '求职新手',
          total_battles: d.total_battles || 0,
          interviews: d.interviews || 0,
          wins: d.wins || 0,
          badges: d.badges || [],
        })
      }
    } catch (err) {
      console.log('Load profile error:', err)
    } finally {
      // loaded
    }
  }

  const achievements = [
    { name: '初出茅庐', Icon: Footprints, bg: 'bg-badge-gold', iconColor: '#D4A574', unlocked: true },
    { name: '面霸', Icon: Mic, bg: 'bg-badge-green', iconColor: '#5B9A6F', unlocked: true },
    { name: '投递达人', Icon: Send, bg: 'bg-primary-container', iconColor: '#3A4A44', unlocked: true },
    { name: 'offer收割机', Icon: Trophy, bg: '', iconColor: '#6B7B7466', unlocked: false },
  ]

  const menuItems = [
    { label: '简历库', path: '/pages/resume/list', Icon: FileText, iconBg: 'bg-emerald-50', iconColor: '#10B981' },
    { label: '职业规划', path: '/pages/plan/sandbox', Icon: Sparkles, iconBg: 'bg-violet-50', iconColor: '#7C5CFC' },
    { label: '训练记录', path: '/pages/dashboard/index', Icon: Swords, iconBg: 'bg-orange-50', iconColor: '#E8864A' },
    { label: '求职笔记', path: '/pages/profile/achievements', Icon: BookOpen, iconBg: 'bg-blue-50', iconColor: '#3B82F6' },
    { label: '招聘笔记', path: '/pages/hr-sim/history', Icon: ClipboardList, iconBg: 'bg-purple-50', iconColor: '#8B5CF6' },
    { label: '设置与帮助', path: '', Icon: Settings, iconBg: 'bg-gray-50', iconColor: '#6B7B74' },
  ]

  return (
    <View className="min-h-full bg-background">
      {/* 用户信息区 */}
      <View className="mx-4 mt-3 mb-6">
        <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          {/* 渐变装饰条 */}
          <View className="h-2" style={{ background: 'linear-gradient(90deg, #3A4A44, #5B9A6F)' }} />
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-3">
              {/* 头像带光环 */}
              <View className="relative flex-shrink-0">
                <View className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(135deg, #5B9A6F, #D4A574)', padding: '2px', margin: '-2px' }} />
                <View className="w-12 h-12 rounded-full bg-primary flex items-center justify-center relative" style={{ overflow: 'hidden' }}>
                  <Text className="text-lg font-bold text-primary-foreground">{userInfo.nick_name[0]}</Text>
                </View>
              </View>
              {/* 用户名和等级 */}
              <View className="flex-1 min-w-0">
                <Text className="block text-base font-semibold text-foreground">{userInfo.nick_name}</Text>
                <View className="mt-1 px-3 py-1 rounded-full bg-primary-container inline-flex self-start">
                  <Text className="text-xs font-semibold text-primary">Lv.{userInfo.level} {userInfo.title}</Text>
                </View>
              </View>
              {/* 设置齿轮图标 */}
              <View className="w-10 h-10 flex items-center justify-center text-muted-foreground rounded-full btn-press">
                <Settings size={20} color="#6B7B74" />
              </View>
            </View>
            {/* 统计行 */}
            <View className="flex flex-row items-center justify-center gap-6 mt-4 pt-3 border-t border-outline-variant border-opacity-15">
              {[
                { value: userInfo.total_battles, label: '投递' },
                { value: userInfo.interviews, label: '面试' },
                { value: userInfo.wins, label: 'Offer' },
              ].map((stat, idx) => (
                <View key={stat.label} className="flex flex-col items-center">
                  <Text className="text-lg font-bold text-foreground">{stat.value}</Text>
                  <Text className="text-xs text-muted-foreground mt-1">{stat.label}</Text>
                  {idx < 2 && <View className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-outline-variant bg-opacity-20" />}
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 成就展示 */}
      <View className={`px-4 mb-6 ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
        <View className="flex flex-row items-center justify-between mb-3">
          <Text className="block text-base font-semibold text-foreground">成就墙</Text>
          <View className="btn-press" onClick={() => Taro.navigateTo({ url: '/pages/profile/achievements' })}>
            <Text className="text-sm text-muted-foreground">查看全部{'>'}</Text>
          </View>
        </View>
        <View className="flex flex-row gap-3 overflow-x-auto pb-1">
          {achievements.map((ach, idx) => (
            <View
              key={ach.name}
              className={`flex flex-col items-center gap-2 flex-shrink-0 ${loaded ? `anim-fade-in-scale anim-delay-${idx + 2}` : 'opacity-0'}`}
            >
              <View
                className={`w-16 h-16 rounded-full flex items-center justify-center ${ach.unlocked ? `${ach.bg} badge-glow` : 'border-2 border-dashed border-outline-variant border-opacity-40 bg-muted'}`}
              >
                <ach.Icon size={28} color={ach.iconColor} />
              </View>
              <Text className={`text-xs font-medium ${ach.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{ach.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 功能菜单列表 */}
      <View className="mx-4 mb-6">
        <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up anim-delay-3' : 'opacity-0'}`}>
          <CardContent className="p-0">
            {menuItems.map((item, idx) => (
              <View key={item.label}>
                {idx > 0 && <View className="h-px bg-outline-variant bg-opacity-10 mx-4" />}
                <View
                  className="flex flex-row items-center px-4 py-4 btn-press"
                  onClick={() => {
                    if (item.path) {
                      Taro.navigateTo({ url: item.path })
                    }
                  }}
                >
                  <View className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center mr-3 flex-shrink-0`}>
                    <item.Icon size={18} color={item.iconColor} />
                  </View>
                  <Text className="flex-1 text-sm font-medium text-foreground">{item.label}</Text>
                  <ChevronRight size={16} color="#6B7B7480" />
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      {/* 版本信息 */}
      <View className="pb-6 pt-2">
        <Text className="block text-center text-xs text-muted-foreground" style={{ opacity: 0.6 }}>职引 v1.0.0 · 让求职成为一场冒险</Text>
      </View>
    </View>
  )
}
