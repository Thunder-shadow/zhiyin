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
  const [loaded, setLoaded] = useState(false)

  // 经验条百分比（Level = floor(sqrt(EXP/100)) + 1）
  const expForCurrentLevel = Math.pow(userInfo.level - 1, 2) * 100
  const expForNextLevel = Math.pow(userInfo.level, 2) * 100
  const expPercent = userInfo.level <= 1
    ? Math.min((userInfo.exp / 100) * 100, 100)
    : Math.min(((userInfo.exp - expForCurrentLevel) / (expForNextLevel - expForCurrentLevel)) * 100, 100)

  useEffect(() => {
    loadDashboard()
    setTimeout(() => setLoaded(true), 80)
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
    { icon: Map, label: 'AI规划', path: '/pages/plan/sandbox', color: '#FF6B35', bg: 'bg-entry-sandbox-bg', iconBg: 'bg-entry-sandbox-icon-bg' },
    { icon: FileText, label: '简历库', path: '/pages/resume/list', color: '#3B82F6', bg: 'bg-entry-resume-bg', iconBg: 'bg-entry-resume-icon-bg' },
    { icon: Building, label: '我的副本', path: '/pages/company/hall', color: '#10B981', bg: 'bg-entry-dungeon-bg', iconBg: 'bg-entry-dungeon-icon-bg' },
    { icon: Swords, label: '训练场', path: '/pages/interview/lobby', color: '#8B5CF6', bg: 'bg-entry-sandbox-bg', iconBg: 'bg-entry-sandbox-icon-bg' },
  ]

  const funnelItems = [
    { label: '已投递', count: stats.applied, bg: 'bg-blue-50', textColor: 'text-blue-500' },
    { label: '面试中', count: stats.interviewing, bg: 'bg-purple-50', textColor: 'text-purple-500' },
    { label: '已收获', count: stats.offered, bg: 'bg-emerald-50', textColor: 'text-emerald-500' },
  ]

  return (
    <View className='min-h-full bg-background'>
      {/* 顶部深蓝区域：用户信息 + 经验条 */}
      <View
        className='rounded-b-3xl relative overflow-hidden' style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '24px', paddingBottom: '32px' }}
        style={{ background: 'linear-gradient(135deg, #2D3A35 0%, #3A4A44 50%, #4A6A5C 100%)' }}
      >
        {/* 背景装饰圆 */}
        <View className='absolute -top-8 -right-8 w-32 h-32 rounded-full' style={{ background: 'radial-gradient(circle, rgba(91,154,111,0.2) 0%, transparent 70%)' }} />
        <View className='absolute bottom-4 -left-4 w-20 h-20 rounded-full' style={{ background: 'radial-gradient(circle, rgba(212,165,116,0.15) 0%, transparent 70%)' }} />

        <View className='flex flex-row items-center justify-between mb-4 relative'>
          <View className='flex flex-row items-center gap-3'>
            {/* 头像带 3D 光圈 */}
            <View className='relative'>
              <View className='absolute inset-0 rounded-full' style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB347)', padding: '2px', margin: '-2px' }} />
              <View className='w-12 h-12 rounded-full bg-accent flex items-center justify-center relative' style={{ overflow: 'hidden' }}>
                <Text className='text-white text-lg font-bold'>{userInfo.nick_name[0]}</Text>
              </View>
            </View>
            <View>
              <Text className='block text-white font-bold text-lg'>{userInfo.nick_name}</Text>
              <View className='flex flex-row items-center gap-2 mt-1'>
                <Badge variant='secondary' className='bg-orange-500 text-white border-none text-xs badge-glow'>
                  Lv.{userInfo.level}
                </Badge>
                <Text className='text-accent text-xs'>{userInfo.title}</Text>
              </View>
            </View>
          </View>
          <View className='anim-bounce-in'>
            <Trophy size={24} color='#FFB347' />
          </View>
        </View>
        {/* 经验条 */}
        <View className='relative'>
          <View className='flex flex-row items-center justify-between mb-1'>
            <Text className='text-gray-300 text-xs'>EXP</Text>
            <Text className='text-accent text-xs font-mono'>{userInfo.exp} / {expForNextLevel}</Text>
          </View>
          <View className='w-full h-2 bg-primary-dark rounded-full overflow-hidden' style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <View
              className='h-full rounded-full progress-animated'
              style={{
                width: `${expPercent}%`,
                background: 'linear-gradient(90deg, #FF6B35, #FFB347)',
              }}
            />
          </View>
        </View>
      </View>

      {/* 漏斗视图：投递 → 面试 → Offer */}
      <View style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '-16px' }}>
        <Card className={`shadow-card-hover ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <CardContent className='p-4'>
            <View className='flex flex-row items-center justify-between mb-3'>
              <Text className='block font-semibold text-foreground'>求职漏斗</Text>
              <TrendingUp size={16} color='#6B7B74' />
            </View>
            <View className='flex flex-row items-center justify-around'>
              {funnelItems.map((item, idx) => (
                <View key={item.label} className='flex flex-col items-center'>
                  <View className={`w-14 h-14 rounded-full ${item.bg} flex items-center justify-center mb-1 card-hover`} style={{ overflow: 'hidden' }}>
                    <Text className={`block ${item.textColor} font-bold text-xl font-mono`}>{item.count}</Text>
                  </View>
                  <Text className='block text-muted-foreground text-xs'>{item.label}</Text>
                  {/* 连接箭头 */}
                  {idx < funnelItems.length - 1 && (
                    <View className='absolute' style={{ right: '-12px', top: '50%', transform: 'translateY(-50%)' }}>
                      <Text className='text-muted-foreground text-xs' style={{ opacity: 0.4 }}>→</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 快捷入口 */}
      <View style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '20px' }}>
        <Text className='block font-semibold text-foreground mb-3'>快捷入口</Text>
        <View className='grid grid-cols-4 gap-3'>
          {quickEntries.map((entry, idx) => (
            <View
              key={entry.label}
              className={`flex flex-col items-center gap-2 p-3 bg-card rounded-xl shadow-card card-hover ${loaded ? `anim-fade-in-scale anim-delay-${idx + 1}` : 'opacity-0'}`}
              onClick={() => Taro.navigateTo({ url: entry.path })}
            >
              <View className={`w-10 h-10 rounded-xl flex items-center justify-center ${entry.iconBg} icon-entrance`}>
                <entry.icon size={22} color={entry.color} />
              </View>
              <Text className='block text-xs text-foreground font-medium'>{entry.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 最近行动 */}
      <View style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '20px', paddingBottom: '16px' }}>
        <View className='flex flex-row items-center justify-between mb-3'>
          <Text className='block font-semibold text-foreground'>最近行动</Text>
          <View className='flex flex-row items-center btn-press' onClick={() => Taro.switchTab({ url: '/pages/company/hall' })}>
            <Text className='text-xs text-muted-foreground'>查看全部</Text>
            <ChevronRight size={14} color='#6B7B74' />
          </View>
        </View>
        <Card className={`shadow-card ${loaded ? 'anim-fade-in-up anim-delay-3' : 'opacity-0'}`}>
          <CardContent className='p-6 flex flex-col items-center justify-center'>
            <View className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3' style={{ overflow: 'hidden' }}>
              <Target size={28} color='#B8C2BB' />
            </View>
            <Text className='block text-muted-foreground text-sm font-medium mt-1'>还没有行动记录</Text>
            <Text className='block text-muted-foreground text-xs mt-1' style={{ opacity: 0.6 }}>去发现心仪公司，立下战书吧</Text>
            <View
              className='mt-4 px-5 py-2 bg-primary rounded-full btn-press'
              onClick={() => Taro.switchTab({ url: '/pages/company/hall' })}
            >
              <Text className='text-sm font-semibold text-primary-foreground'>去探索</Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
