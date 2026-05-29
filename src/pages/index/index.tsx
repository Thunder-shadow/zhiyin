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
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadGameState()
    setTimeout(() => setLoaded(true), 80)
  }, [])

  const loadGameState = async () => {
    try {
      const res = await Network.request({ url: '/api/user/profile' })
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
    } finally {
      // loaded
    }
  }

  const expPercent = gameState.exp_to_next > 0
    ? Math.min(Math.round((gameState.exp / gameState.exp_to_next) * 100), 100)
    : 0

  const funnelStages = [
    { label: '投递', count: gameState.total_battles, color: 'bg-funnel-deliver', textColor: 'text-funnel-deliver' },
    { label: '面试', count: gameState.interviews, color: 'bg-funnel-interview', textColor: 'text-funnel-interview' },
    { label: 'Offer', count: gameState.wins, color: 'bg-funnel-offer', textColor: 'text-funnel-offer' },
  ]

  // tabBar页面需要用switchTab，普通页面用navigateTo
  const quickActions = [
    { label: '职业沙盘', path: '/pages/plan/sandbox', useSwitchTab: false, Icon: Sparkles, bg: 'bg-entry-sandbox-bg', iconBg: 'bg-entry-sandbox-icon-bg', iconColor: '#7C5CFC', desc: 'AI帮你规划' },
    { label: '副本大厅', path: '/pages/company/hall', useSwitchTab: true, Icon: Building, bg: 'bg-entry-dungeon-bg', iconBg: 'bg-entry-dungeon-icon-bg', iconColor: '#3A4A44', desc: '浏览岗位' },
    { label: '训练场', path: '/pages/interview/lobby', useSwitchTab: true, Icon: Swords, bg: 'bg-entry-training-bg', iconBg: 'bg-entry-training-icon-bg', iconColor: '#E8864A', desc: '模拟面试' },
    { label: '简历库', path: '/pages/resume/list', useSwitchTab: false, Icon: FileText, bg: 'bg-entry-resume-bg', iconBg: 'bg-entry-resume-icon-bg', iconColor: '#A89060', desc: '管理简历' },
  ]

  const handleNavigate = (action: typeof quickActions[0]) => {
    if (action.useSwitchTab) {
      Taro.switchTab({ url: action.path })
    } else {
      Taro.navigateTo({ url: action.path })
    }
  }

  return (
    <View className='min-h-full bg-background'>
      {/* 1. 用户概览区 - 渐变背景 */}
      <View style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px' }}>
        <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          {/* 渐变顶部装饰条 */}
          <View className='h-2' style={{ background: 'linear-gradient(90deg, #3A4A44, #5B9A6F, #D4A574)' }} />
          <CardContent className='p-4'>
            <View className='flex flex-row items-center gap-3'>
              {/* 头像带光环 */}
              <View className='relative flex-shrink-0'>
                <View className='absolute inset-0 rounded-full' style={{ background: 'linear-gradient(135deg, #5B9A6F, #D4A574)', padding: '2px', margin: '-2px' }} />
                <View className='w-12 h-12 rounded-full bg-primary flex items-center justify-center relative' style={{ overflow: 'hidden' }}>
                  <Text className='text-lg font-bold text-primary-foreground'>{gameState.title[0]}</Text>
                </View>
              </View>
              {/* 中间信息 */}
              <View className='flex-1 min-w-0'>
                <View className='flex flex-row items-center gap-2'>
                  <Text className='text-base font-semibold text-foreground'>小初</Text>
                  <View className='px-2 py-1 rounded-full bg-primary-container'>
                    <Text className='text-xs font-bold text-primary'>Lv.{gameState.level}</Text>
                  </View>
                </View>
                <Text className='block text-sm text-muted-foreground mt-1'>称号：{gameState.title}</Text>
                {/* 经验进度条 */}
                <View className='flex flex-row items-center gap-2 mt-2'>
                  <View className='flex-1 h-2 bg-muted rounded-full overflow-hidden'>
                    <View
                      className='h-full rounded-full progress-animated'
                      style={{ width: `${expPercent}%`, background: 'linear-gradient(90deg, #3A4A44, #5B9A6F)' }}
                    />
                  </View>
                  <Text className='text-xs text-muted-foreground whitespace-nowrap'>{gameState.exp}/{gameState.exp_to_next} EXP</Text>
                </View>
              </View>
              {/* 右侧连续活跃徽章 */}
              {gameState.streak > 0 && (
                <View className='flex-shrink-0 flex flex-col items-center gap-1'>
                  <View className='flex flex-row items-center px-3 py-1 rounded-lg bg-warning bg-opacity-20 badge-glow'>
                    <Flame size={14} color='#D4A574' />
                    <Text className='text-xs font-semibold text-warning ml-1'>{gameState.streak}天</Text>
                  </View>
                  <Text className='text-xs text-muted-foreground' style={{ fontSize: '10px' }}>连续活跃</Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 2. 求职漏斗看板 */}
      <View style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '20px' }}>
        <Card className={`shadow-card ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
          <CardContent className='p-4'>
            <Text className='block text-base font-semibold text-foreground mb-4'>求职漏斗</Text>
            {/* 漏斗可视化 - 进度条 + 箭头连接 */}
            {funnelStages.map((stage, idx) => (
              <View key={stage.label}>
                <View className='flex flex-row items-center gap-3'>
                  <Text className={`text-sm font-medium w-10 text-right ${stage.textColor}`}>{stage.label}</Text>
                  <View className='flex-1 h-3 bg-muted rounded-full overflow-hidden'>
                    <View
                      className={`h-full rounded-full ${stage.color} progress-animated`}
                      style={{ width: `${funnelStages[0].count > 0 ? Math.max(Math.round((stage.count / funnelStages[0].count) * 100), 8) : 8}%` }}
                    />
                  </View>
                  <Text className='block text-base font-bold text-foreground w-6 text-right'>{stage.count}</Text>
                </View>
                {/* 箭头连接符 */}
                {idx < funnelStages.length - 1 && (
                  <View className='flex flex-row justify-center my-2'>
                    <Text className='text-muted-foreground text-xs' style={{ opacity: 0.4 }}>▼</Text>
                  </View>
                )}
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      {/* 3. 快捷入口 2x2 */}
      <View style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '20px' }}>
        <View className='grid grid-cols-2 gap-3'>
          {quickActions.map((action, idx) => (
            <Card
              key={action.label}
              className={`shadow-card card-hover ${action.bg} ${loaded ? `anim-fade-in-scale anim-delay-${idx + 2}` : 'opacity-0'}`}
              onClick={() => handleNavigate(action)}
            >
              <CardContent className='p-4'>
                <View className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.iconBg} icon-entrance`}>
                  <action.Icon size={22} color={action.iconColor} />
                </View>
                <Text className='block text-sm font-semibold text-foreground mt-3'>{action.label}</Text>
                <Text className='block text-xs text-muted-foreground mt-1'>{action.desc}</Text>
              </CardContent>
            </Card>
          ))}
        </View>
      </View>

      {/* 4. HR反向模拟入口 */}
      <View style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '20px', paddingBottom: '16px' }}>
        <Card
          className={`shadow-card card-hover ${loaded ? 'anim-fade-in-up anim-delay-5' : 'opacity-0'}`}
          onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/index' })}
        >
          <CardContent className='p-4'>
            <View className='flex flex-row items-center gap-3'>
              <View className='w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0'>
                <LayoutDashboard size={20} color='#FFFFFF' />
              </View>
              <View className='flex-1 min-w-0'>
                <View className='flex flex-row items-center gap-2'>
                  <Text className='block text-sm font-semibold text-foreground'>HR反向模拟</Text>
                  <View className='px-2 py-1 rounded bg-accent'>
                    <Text className='text-xs font-bold text-accent-foreground' style={{ fontSize: '9px' }}>NEW</Text>
                  </View>
                </View>
                <Text className='block text-xs text-muted-foreground mt-1'>扮演HR面试候选人，训练选人眼光</Text>
              </View>
              <View className='anim-slide-in-right'>
                <ChevronRight size={20} color='#6B7B74' />
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}
