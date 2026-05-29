/* eslint-disable @typescript-eslint/no-require-imports */
import { View, Text } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { User, Clock, ChevronRight, Swords, Bot, Send } from 'lucide-react-taro'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect, useRef, useCallback } from 'react'
/* eslint-disable @typescript-eslint/no-require-imports */
import { Network } from '@/network'

interface Message {
  id: string
  role: 'hr' | 'assistant' | 'thinking'
  content: string
  isThinking?: boolean
}

export default function HrSim() {
  const router = useRouter()
  const [step, setStep] = useState<'select' | 'interview'>('select')
  const [candidate, setCandidate] = useState<{
    id: string
    name: string
    school: string
    major: string
    background: string
    personality: string
    realLevel: string
    color: string
  } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef<any>(null)
  const abortRef = useRef<AbortController | null>(null)

  /** 初始化面试对话 */
  const initInterview = useCallback(async (c: typeof candidate) => {
    if (!c) return
    // 生成开场白
    const openingPrompt = `你是一个正在参加面试的求职者。以下是你的背景信息：

姓名：${c.name}
学校：${c.school}
专业：${c.major}
背景：${c.background || '暂无'}
性格：${c.personality || '暂无'}
面试评级：${c.realLevel}

请用第一人称，以这个求职者的身份，简洁友好地打招呼并开始面试。例如："您好，我是${c.name}，很高兴有机会来面试这个岗位。请多关照。"

回复长度控制在50字以内。`

    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: '',
      isThinking: true,
    }])

    try {
      const response = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: { action: 'hr_sim_response', prompt: openingPrompt },
      })

      if (response.data?.code === 0 && response.data?.data?.reply) {
        setMessages([{
          id: Date.now().toString(),
          role: 'assistant',
          content: response.data.data.reply,
          isThinking: false,
        }])
      } else {
        setMessages([{
          id: Date.now().toString(),
          role: 'assistant',
          content: '抱歉，面试官暂时无法启动。请稍后重试。',
          isThinking: false,
        }])
      }
    } catch (err) {
      console.error('Init interview error:', err)
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: '抱歉，面试官暂时无法启动。请稍后重试。',
        isThinking: false,
      }])
    }
  }, [])

  useEffect(() => {
    // 检查是否有候选人参数
    const { candidateId, candidateName, candidateSchool, candidateMajor, candidateBackground, candidatePersonality, candidateRealLevel, candidateColor } = router.params
    if (candidateId) {
      const c = {
        id: candidateId,
        name: decodeURIComponent(candidateName || '候选人'),
        school: decodeURIComponent(candidateSchool || ''),
        major: decodeURIComponent(candidateMajor || ''),
        background: decodeURIComponent(candidateBackground || ''),
        personality: decodeURIComponent(candidatePersonality || ''),
        realLevel: decodeURIComponent(candidateRealLevel || 'B'),
        color: decodeURIComponent(candidateColor || '#8B5CF6'),
      }
      setCandidate(c)
      setStep('interview')
      // 初始化面试对话
      initInterview(c)
    }
    setTimeout(() => setLoaded(true), 80)
    // 在 effect 中保存 ref 值到变量
    const abortController = abortRef.current
    return () => {
      if (abortController) {
        abortController.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.params, initInterview])

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ position: 0, animated: true })
      }, 100)
    }
  }, [messages])

  /** 发送消息 */
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'hr',
      content: input.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsLoading(true)

    // 添加"思考中"指示器
    const thinkingId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: thinkingId,
      role: 'assistant',
      content: '候选人思考中...',
      isThinking: true,
    }])

    try {
      const response = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          action: 'hr_sim_response',
          prompt: currentInput,
          history: messages.filter(m => !m.isThinking).map(m => ({
            role: m.role === 'hr' ? 'user' : 'assistant',
            content: m.content,
          })),
        },
      })

      // 移除"思考中"
      setMessages(prev => prev.filter(m => m.id !== thinkingId))

      if (response.data?.code === 0 && response.data?.data?.reply) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: response.data.data.reply,
          isThinking: false,
        }])
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: '抱歉，候选人暂时无法回复。',
          isThinking: false,
        }])
      }
    } catch (err) {
      console.error('Send message error:', err)
      // 移除"思考中"
      setMessages(prev => prev.filter(m => m.id !== thinkingId))
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '抱歉，候选人暂时无法回复。',
        isThinking: false,
      }])
    } finally {
      setIsLoading(false)
    }
  }

  /** 结束面试 */
  const endInterview = () => {
    Taro.showModal({
      title: '结束面试',
      content: '确定要结束这场面试吗？',
      confirmText: '结束',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateBack()
        }
      },
    })
  }

  /** 跳转到候选人列表页面 */
  const goToCandidates = () => {
    Taro.navigateTo({ url: '/pages/hr-sim/candidates?mode=select' })
  }

  // 选择候选人阶段
  if (step === 'select') {
    return (
      <View className='min-h-full bg-background pb-safe'>
        {/* 顶部 */}
        <View
          className='rounded-b-2xl relative overflow-hidden' style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '24px', paddingTop: '16px' }}
          style={{
            background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)',
          }}
        >
          <View className='absolute -top-4 -right-4 w-20 h-20 rounded-full' style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
          <View className='flex flex-row items-center gap-3 relative'>
            <View className='flex-1'>
              <Text className='block text-white font-bold text-base'>HR反向模拟</Text>
              <Text className='block text-gray-300 text-xs'>扮演面试官，训练选人眼光</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '24px', paddingBottom: '24px' }}>
          {/* 主入口卡片 */}
          <View className={`${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
            <Card className='shadow-card overflow-hidden' onClick={goToCandidates}>
              <CardContent className='p-0'>
                <View
                  className='p-6 relative overflow-hidden'
                  style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #A78BFA 100%)' }}
                >
                  <View className='absolute -top-6 -right-6 w-32 h-32 rounded-full' style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />
                  <View className='flex flex-row items-center gap-4 relative'>
                    <View className='w-16 h-16 rounded-2xl bg-white bg-opacity-20 flex items-center justify-center'>
                      <Swords size={32} color='#fff' />
                    </View>
                    <View className='flex-1'>
                      <Text className='block text-white font-bold text-lg mb-1'>开始面试</Text>
                      <Text className='block text-white text-opacity-80 text-sm'>从候选人库选择，开始一场面试训练</Text>
                    </View>
                    <ChevronRight size={24} color='rgba(255,255,255,0.8)' />
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* 功能入口 */}
          <View className={`mt-5 flex flex-col gap-3 ${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}>
            <Card className='shadow-card card-hover' onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/candidates' })}>
              <CardContent className='p-4'>
                <View className='flex flex-row items-center gap-3'>
                  <View className='w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center'>
                    <User size={24} color='#7C3AED' />
                  </View>
                  <View className='flex-1'>
                    <Text className='block font-semibold text-foreground'>候选人管理</Text>
                    <Text className='block text-xs text-muted-foreground mt-1'>创建、编辑候选人信息</Text>
                  </View>
                  <ChevronRight size={18} color='#6B7B7480' />
                </View>
              </CardContent>
            </Card>

            <Card className='shadow-card card-hover' onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/history' })}>
              <CardContent className='p-4'>
                <View className='flex flex-row items-center gap-3'>
                  <View className='w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center'>
                    <Clock size={24} color='#7C3AED' />
                  </View>
                  <View className='flex-1'>
                    <Text className='block font-semibold text-foreground'>历史招聘笔记</Text>
                    <Text className='block text-xs text-muted-foreground mt-1'>查看往期面试评估报告</Text>
                  </View>
                  <ChevronRight size={18} color='#6B7B7480' />
                </View>
              </CardContent>
            </Card>
          </View>

          {/* 说明 */}
          <View className={`mt-6 p-4 bg-violet-50 rounded-xl ${loaded ? 'anim-fade-in-up anim-delay-3' : 'opacity-0'}`}>
            <Text className='block text-xs text-violet-700 leading-relaxed'>
              在这里，你可以扮演HR面试官，与候选人进行模拟面试。通过观察候选人的回答表现，训练你的面试技巧和识人眼光。
            </Text>
          </View>
        </View>
      </View>
    )
  }

  // 面试阶段
  return (
    <View className='min-h-full bg-background flex flex-col'>
      {/* 顶部 */}
      <View
        className='flex flex-row items-center gap-3' style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
        style={{
          background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)',
        }}
      >
        <View className='flex-1'>
          <Text className='block text-white font-bold text-sm'>{candidate?.name || '面试中'}</Text>
          <Text className='block text-gray-300 text-xs'>{candidate?.school || ''}</Text>
        </View>
        <View className='w-10 h-10 rounded-full flex items-center justify-center' style={{ backgroundColor: candidate?.color || '#8B5CF6' }}>
          <Text className='text-white text-sm font-bold'>{candidate?.name?.charAt(0) || '?'}</Text>
        </View>
      </View>

      {/* 消息列表 */}
      <View className='flex-1 overflow-y-auto p-4'>
        {messages.map((msg) => (
          <View key={msg.id} className={`flex ${msg.role === 'hr' ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
            {msg.role !== 'hr' && (
              <View className='w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0' style={{ backgroundColor: candidate?.color || '#8B5CF6' }}>
                <Text className='text-white text-xs font-bold'>{candidate?.name?.charAt(0) || '?'}</Text>
              </View>
            )}
            {msg.role === 'hr' && (
              <View className='w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0'>
                <Bot size={16} color='#6B7B74' />
              </View>
            )}
            <View
              className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                msg.role === 'hr'
                  ? 'bg-primary text-on-primary rounded-tr-sm'
                  : 'bg-gray-100 text-foreground rounded-tl-sm'
              }`}
            >
              {msg.isThinking ? (
                <View className='flex flex-row items-center gap-1'>
                  <Text className={`block text-xs ${msg.role === 'hr' ? 'text-white' : 'text-muted-foreground'}`}>
                    {msg.content}
                  </Text>
                </View>
              ) : (
                <Text className={`block text-sm leading-relaxed ${msg.role === 'hr' ? 'text-white' : 'text-foreground'}`}>
                  {msg.content}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* 输入区 */}
      <View className='p-3 bg-background border-t border-outline-variant'>
        <View className='flex flex-row items-end gap-2'>
          <View className='flex-1'>
            <Input
              className='bg-surface-container rounded-full px-4 py-2'
              placeholder='输入你的问题...'
              value={input}
              onInput={(e: any) => setInput(e.detail.value || '')}
              disabled={isLoading}
              onConfirm={sendMessage}
              confirmType='send'
            />
          </View>
          <View className='flex-shrink-0'>
            <Button
              size='sm'
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className='rounded-full h-9 w-9 p-0 flex items-center justify-center'
              style={{ background: input.trim() ? 'linear-gradient(135deg, #7C3AED, #8B5CF6)' : '#ccc' }}
            >
              <Send size={16} color='#fff' />
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
