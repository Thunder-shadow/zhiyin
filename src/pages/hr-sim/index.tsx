// eslint-disable-next-line no-restricted-syntax -- 聊天输入框需使用原生 Input 以支持 adjustPosition 防止键盘推页面
import { View, Text, ScrollView, Input as TaroInput } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Bot, User, Swords, ArrowLeft } from 'lucide-react-taro'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Network } from '@/network'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isThinking?: boolean
}

function getStatusBarHeight(): number {
  try {
    const sysInfo = Taro.getSystemInfoSync()
    return sysInfo.statusBarHeight || 0
  } catch {
    return 0
  }
}

export default function HrSimIndex() {
  const router = useRouter()
  const [step, setStep] = useState<'menu' | 'interview'>('menu')
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
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const scrollRef = useRef('')
  const statusBarHeight = getStatusBarHeight()
  const messagesRef = useRef<Message[]>([])

  // 监听键盘高度变化
  useEffect(() => {
    const listener = (res: { height: number }) => {
      setKeyboardHeight(res.height > 0 ? res.height : 0)
    }
    Taro.onKeyboardHeightChange(listener)
    return () => {
      Taro.offKeyboardHeightChange(listener)
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    scrollRef.current = 'scroll-' + Date.now()
    setTimeout(() => {
      Taro.pageScrollTo({ scrollTop: 99999, duration: 100 }).catch(() => {})
    }, 50)
  }, [])

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

    const tempId = 'init-' + Date.now()
    const tempMessages: Message[] = [{
      id: tempId,
      role: 'assistant',
      content: '',
      isThinking: true,
    }]
    messagesRef.current = tempMessages
    setMessages([...tempMessages])
    setIsLoading(true)
    scrollToBottom()

    try {
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          action: 'hr_sim',
          prompt: openingPrompt,
          candidate: {
            id: c.id,
            name: c.name,
            school: c.school,
            major: c.major,
          }
        }
      })

      if (res.data && (res.data.data || res.data.reply)) {
        const reply = res.data.data?.reply || res.data.reply || ''
        tempMessages[0] = {
          id: tempId,
          role: 'assistant',
          content: reply,
          isThinking: false,
        }
        messagesRef.current = tempMessages
        setMessages([...tempMessages])
      } else {
        tempMessages[0] = {
          id: tempId,
          role: 'assistant',
          content: '抱歉，面试官暂时无法启动。请稍后重试。',
          isThinking: false,
        }
        messagesRef.current = tempMessages
        setMessages([...tempMessages])
      }
    } catch (err) {
      console.error('初始化面试失败:', err)
      tempMessages[0] = {
        id: tempId,
        role: 'assistant',
        content: '抱歉，面试官暂时无法启动。请稍后重试。',
        isThinking: false,
      }
      messagesRef.current = tempMessages
      setMessages([...tempMessages])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }, [scrollToBottom])

  /** 发送回复 */
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = { id: 'user-' + Date.now(), role: 'user', content: trimmed }
    messagesRef.current = [...messagesRef.current, userMsg]
    setMessages([...messagesRef.current])
    setInput('')
    setIsLoading(true)

    const aiMsg: Message = { id: 'ai-' + Date.now(), role: 'assistant', content: '', isThinking: true }
    messagesRef.current = [...messagesRef.current, aiMsg]
    setMessages([...messagesRef.current])
    scrollToBottom()

    try {
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          action: 'hr_sim',
          conversation: messagesRef.current.filter(m => m.role === 'user').map(m => ({
            role: m.role,
            content: m.content
          })),
          candidate: candidate ? {
            id: candidate.id,
            name: candidate.name,
            school: candidate.school,
            major: candidate.major,
          } : undefined
        }
      })

      if (res.data.code === 200 && res.data.data) {
        const reply = res.data.data.reply || ''
        const msgIndex = messagesRef.current.findIndex(m => m.id === aiMsg.id)
        if (msgIndex !== -1) {
          messagesRef.current[msgIndex] = {
            ...aiMsg,
            content: reply,
            isThinking: false,
          }
        }
        setMessages([...messagesRef.current])
      } else {
        const msgIndex = messagesRef.current.findIndex(m => m.id === aiMsg.id)
        if (msgIndex !== -1) {
          messagesRef.current[msgIndex] = {
            ...aiMsg,
            content: '面试官暂时无法回复，请稍后再试...',
            isThinking: false,
          }
        }
        setMessages([...messagesRef.current])
      }
    } catch (err) {
      console.error('发送消息失败:', err)
      const msgIndex = messagesRef.current.findIndex(m => m.id === aiMsg.id)
      if (msgIndex !== -1) {
        messagesRef.current[msgIndex] = {
          ...aiMsg,
          content: '面试官暂时无法回复，请稍后再试...',
          isThinking: false,
        }
      }
      setMessages([...messagesRef.current])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }, [input, isLoading, candidate, scrollToBottom])

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
      setTimeout(() => initInterview(c), 100)
    }
  }, [router.params, initInterview])

  const handleBack = () => {
    if (step === 'interview') {
      setStep('menu')
      setMessages([])
      messagesRef.current = []
      setCandidate(null)
    } else {
      Taro.navigateBack()
    }
  }

  const lastMsg = messages[messages.length - 1]
  const showThinking = isLoading && messages.length > 0 && lastMsg?.role === 'user'

  if (step === 'menu') {
    return (
      <View style={{ minHeight: '100vh', background: '#F8F9F7' }}>
        {/* 顶部导航 */}
        <View
          className='flex-shrink-0'
          style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '12px', paddingTop: `${statusBarHeight + 8}px`, background: 'linear-gradient(135deg, #3A4A44 0%, #4A5E52 100%)' }}
        >
          <View className='flex flex-row items-center gap-3'>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleBack}
              className='text-white hover:bg-white/20 rounded-full p-2 -ml-2'
            >
              <ArrowLeft size={24} color='#fff' />
            </Button>
            <Text className='block text-white font-bold text-lg'>HR反向模拟</Text>
          </View>
        </View>

        {/* 内容区 */}
        <View className='p-4'>
          <Text className='block text-sm mb-4' style={{ color: '#666' }}>
            点击下方卡片开始面试扮演练习
          </Text>

          <Card className='mb-4' style={{ borderRadius: '16px' }}>
            <CardContent className='p-5'>
              <View className='flex flex-row items-center gap-3 mb-3'>
                <View className='w-12 h-12 rounded-full flex items-center justify-center' style={{ background: 'linear-gradient(135deg, #E26A5C 0%, #D45A4C 100%)' }}>
                  <Swords size={24} color='#fff' />
                </View>
                <View className='flex-1 min-w-0'>
                  <Text className='block text-base font-semibold text-gray-800'>开始面试练习</Text>
                  <Text className='block text-sm' style={{ color: '#666' }}>选择候选人进行模拟面试</Text>
                </View>
              </View>
              <Button
                className='w-full'
                style={{ background: 'linear-gradient(135deg, #3A4A44 0%, #4A5E52 100%)', borderRadius: '12px', height: '44px' }}
                onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/candidates' })}
              >
                <Text className='block text-white text-sm font-medium'>选择候选人</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </View>
    )
  }

  return (
    <View style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* 自定义顶部导航栏 */}
      <View
        className='flex-shrink-0'
        style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '12px', paddingTop: `${statusBarHeight + 8}px`, background: 'linear-gradient(135deg, #3A4A44 0%, #4A5E52 100%)' }}
      >
        <View className='flex flex-row items-center gap-3'>
          <Button
            variant='ghost'
            size='icon'
            onClick={handleBack}
            className='text-white hover:bg-white/20 rounded-full p-2 -ml-2'
          >
            <ArrowLeft size={24} color='#fff' />
          </Button>
          <View className='flex-1 min-w-0'>
            <Text className='block text-white font-bold text-base'>HR反向模拟</Text>
            {candidate && (
              <Text className='block text-sm' style={{ color: 'rgba(255,255,255,0.7)' }}>{candidate.name}</Text>
            )}
          </View>
        </View>
      </View>

      {/* 聊天区 */}
      <ScrollView
        className='flex-1'
        style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}
        scrollY
        scrollIntoView={scrollRef.current}
        scrollWithAnimation
      >
        {/* 候选人信息卡片 */}
        {candidate && (
          <Card className='mb-4' style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #F0F4F2 0%, #E8EDE9 100%)' }}>
            <CardContent className='p-4'>
              <View className='flex flex-row items-center gap-3'>
                <View
                  className='w-12 h-12 rounded-full flex items-center justify-center'
                  style={{ background: candidate.color }}
                >
                  <Text className='text-white font-bold text-lg'>{candidate.name.charAt(0)}</Text>
                </View>
                <View className='flex-1 min-w-0'>
                  <Text className='block text-base font-semibold' style={{ color: '#3A4A44' }}>{candidate.name}</Text>
                  <Text className='block text-xs' style={{ color: '#666' }}>{candidate.school} · {candidate.major}</Text>
                  <Text className='block text-xs' style={{ color: '#E26A5C' }}>评级: {candidate.realLevel}</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            id={`msg-${msg.id}`}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
          >
            {msg.role === 'assistant' && (
              <View className='w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0' style={{ background: candidate?.color || '#8B5CF6' }}>
                <Bot size={18} color='#fff' />
              </View>
            )}
            <View
              className={`max-w-[75%] px-4 py-3 ${msg.role === 'user' ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'}`}
              style={{
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #3A4A44 0%, #4A5E52 100%)'
                  : '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <Text className='block text-sm' style={{ color: msg.role === 'user' ? '#fff' : '#333', lineHeight: '22px' }}>
                {msg.content}
              </Text>
              {msg.isThinking && (
                <Text className='block text-xs mt-1 animate-pulse' style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : '#999' }}>
                  候选人思考中...
                </Text>
              )}
            </View>
            {msg.role === 'user' && (
              <View className='w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0'>
                <User size={18} color='#666' />
              </View>
            )}
          </View>
        ))}

        {showThinking && (
          <View className='flex flex-row items-center gap-2 mb-4'>
            <View className='w-8 h-8 rounded-full flex items-center justify-center mr-2' style={{ background: candidate?.color || '#8B5CF6' }}>
              <Bot size={18} color='#fff' />
            </View>
            <View className='px-4 py-3 rounded-2xl rounded-tl-sm' style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Text className='block text-xs' style={{ color: '#999' }}>候选人思考中...</Text>
            </View>
          </View>
        )}

        <View id={scrollRef.current} className='h-4' />
      </ScrollView>

      {/* 输入区 - 固定在键盘上方 */}
      <View
        className='flex-shrink-0 px-4 py-3'
        style={{
          background: '#fff',
          borderTop: '1px solid #eee',
          paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 12}px` : '12px',
        }}
      >
        <View
          className='flex flex-row items-center px-4 py-2 rounded-full'
          style={{ background: '#F5F5F5' }}
        >
          <TaroInput
            className='flex-1 text-sm'
            style={{ minHeight: '36px', lineHeight: '36px' }}
            placeholder='输入你的问题...'
            value={input}
            onInput={(e) => setInput(e.detail.value)}
            disabled={isLoading}
            adjustPosition
            onConfirm={sendMessage}
          />
          <View className='ml-2 flex-shrink-0'>
            <Button
              size='sm'
              variant='ghost'
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className='rounded-full p-2'
              style={{ background: input.trim() && !isLoading ? 'linear-gradient(135deg, #3A4A44 0%, #4A5E52 100%)' : '#ddd' }}
            >
              <Send size={18} color={input.trim() && !isLoading ? '#fff' : '#999'} />
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
