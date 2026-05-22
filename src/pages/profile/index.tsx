import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, ChevronRight } from 'lucide-react-taro'
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
    badges: [] as string[],
  })

  useEffect(() => {
    loadProfile()
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
          badges: d.badges || [],
        })
      }
    } catch (err) {
      console.log('Load profile error:', err)
    }
  }

  const menuItems = [
    { label: '成就中心', path: '/pages/profile/achievements', icon: Trophy, color: '#FF6B35' },
  ]

  return (
    <View className="min-h-full bg-background">
      {/* 用户信息头部 */}
      <View className="bg-primary px-4 pt-6 pb-8 rounded-b-3xl">
        <View className="flex flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
            <Text className="text-white text-2xl font-bold">{userInfo.nick_name[0]}</Text>
          </View>
          <View>
            <Text className="block text-white font-bold text-xl">{userInfo.nick_name}</Text>
            <View className="flex flex-row items-center gap-2 mt-1">
              <Badge className="bg-accent text-white border-none text-xs">Lv.{userInfo.level}</Badge>
              <Text className="text-accent text-sm">{userInfo.title}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 统计卡片 */}
      <View className="px-4 -mt-4">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <View className="flex flex-row justify-around">
              <View className="flex flex-col items-center">
                <Text className="block font-bold text-foreground text-xl font-mono">{userInfo.badges.length}</Text>
                <Text className="block text-gray-400 text-xs">徽章</Text>
              </View>
              <View className="flex flex-col items-center">
                <Text className="block font-bold text-foreground text-xl font-mono">{userInfo.exp}</Text>
                <Text className="block text-gray-400 text-xs">经验值</Text>
              </View>
              <View className="flex flex-col items-center">
                <Text className="block font-bold text-foreground text-xl font-mono">{userInfo.level}</Text>
                <Text className="block text-gray-400 text-xs">等级</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 功能菜单 */}
      <View className="px-4 mt-4">
        {menuItems.map((item) => (
          <Card key={item.label} className="shadow-sm mb-3" onClick={() => Taro.navigateTo({ url: item.path })}>
            <CardContent className="p-4">
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                    <item.icon size={18} color={item.color} />
                  </View>
                  <Text className="block text-foreground font-semibold">{item.label}</Text>
                </View>
                <ChevronRight size={16} color="#D1D5DB" />
              </View>
            </CardContent>
          </Card>
        ))}
      </View>
    </View>
  )
}
