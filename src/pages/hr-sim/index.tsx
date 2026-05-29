// eslint-disable-next-line no-restricted-syntax -- 聊天输入框需使用原生 Input 以支持 adjustPosition 防止键盘推页面
import { View, Text, ScrollView, Input as TaroInput } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Bot, User, Swords, ArrowLeft, Loader } from 'lucide-react-taro'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useRef, useCallback, useEffect } from 'react'
import { fetchStream } from '@/utils/stream'

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

  // 监听键盘高度变化 - H5端不支持该API，需try/catch
  useEffect(() => {
    try {
      const listener = (res: { height: number }) => {
        setKeyboardHeight(res.height > 0 ? res.height : 0)
      }
      Taro.onKeyboardHeightChange(listener)
      return () => {
        try {
          Taro.offKeyboardHeightChange(listener)
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore - H5端不支持
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
      await fetchStream('/api/ai/chat/stream', {
        action: 'hr_sim',
        prompt: openingPrompt,
        candidate: c,
      }, {
        onChunk: (content) => {
          messagesRef.current = messagesRef.current.map(msg =>
            msg.id === tempId
              ? { ...msg, content: msg.content + content, isThinking: true }
              : msg
          )
          setMessages([...messagesRef.current])
          scrollToBottom()
        },
        onDone: () => {
          messagesRef.current = messagesRef.current.map(msg =>
            msg.id === tempId
              ? { ...msg, isThinking: false }
              : msg
          )
          setMessages([...messagesRef.current])
        },
        onError: () => {
          messagesRef.current = messagesRef.current.map(msg =>
            msg.id === tempId
              ? { ...msg, content: '抱歉，候选者暂时无法启动...', isThinking: false }
              : msg
          )
          setMessages([...messagesRef.current])
        },
      })
    } catch {
      // 更新提示
      messagesRef.current = messagesRef.current.map(msg =>
        msg.id === tempId
          ? { ...msg, content: '抱歉，候选者暂时无法启动...', isThinking: false }
          : msg
      )
      setMessages([...messagesRef.current])
    } finally {
      setIsLoading(false)
    }
  }, [scrollToBottom])

  // 处理从候选人页面传入的完整参数并直接开始面试
  useEffect(() => {
    const candidateId = router.params?.candidateId
    const candidateName = router.params?.candidateName
    const candidateSchool = router.params?.candidateSchool
    const candidateMajor = router.params?.candidateMajor
    const candidateBackground = router.params?.candidateBackground
    const candidatePersonality = router.params?.candidatePersonality
    const candidateRealLevel = router.params?.candidateRealLevel
    const candidateColor = router.params?.candidateColor

    if (candidateId && candidateName && step === 'menu') {
      const selectedCandidate = {
        id: candidateId,
        name: decodeURIComponent(candidateName),
        school: decodeURIComponent(candidateSchool || ''),
        major: decodeURIComponent(candidateMajor || ''),
        background: decodeURIComponent(candidateBackground || ''),
        personality: decodeURIComponent(candidatePersonality || ''),
        realLevel: decodeURIComponent(candidateRealLevel || 'B'),
        color: decodeURIComponent(candidateColor || '#8B5CF6'),
      }
      setCandidate(selectedCandidate)
      setStep('interview')
      setMessages([])
      messagesRef.current = []
      initInterview(selectedCandidate)
    }
  }, [router.params, step, initInterview])

  /** 发送用户消息并获取 AI 回复 */
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: input.trim(),
    }
    const aiMsg: Message = {
      id: 'ai-' + Date.now(),
      role: 'assistant',
      content: '',
      isThinking: true,
    }

    messagesRef.current = [...messagesRef.current, userMsg, aiMsg]
    setMessages([...messagesRef.current])
    setInput('')
    setIsLoading(true)
    scrollToBottom()

    const conversationForApi = messagesRef.current.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))

    try {
      await fetchStream('/api/ai/chat/stream', {
        action: 'hr_sim',
        conversation: conversationForApi,
        candidate: candidate,
      }, {
        onChunk: (content) => {
          messagesRef.current = messagesRef.current.map(msg =>
            msg.id === aiMsg.id
              ? { ...msg, content: msg.content + content, isThinking: true }
              : msg
          )
          setMessages([...messagesRef.current])
          scrollToBottom()
        },
        onDone: () => {
          messagesRef.current = messagesRef.current.map(msg =>
            msg.id === aiMsg.id
              ? { ...msg, isThinking: false }
              : msg
          )
          setMessages([...messagesRef.current])
        },
        onError: () => {
          messagesRef.current = messagesRef.current.map(msg =>
            msg.id === aiMsg.id
              ? { ...msg, content: '抱歉，候选者暂时无法回复，请稍后再试...', isThinking: false }
              : msg
          )
          setMessages([...messagesRef.current])
        },
      })
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, candidate, scrollToBottom])

  const startInterview = useCallback(async (isRandom: boolean) => {
    if (isRandom) {
      // 随机候选人 - 简单实现
      const randomCandidate = {
        id: 'random-' + Date.now(),
        name: '随机候选人',
        school: '某某大学',
        major: '软件工程',
        background: '实习过3个月，做过一些项目',
        personality: '积极乐观',
        realLevel: 'B',
        color: '#3A4A44',
      }
      setCandidate(randomCandidate)
      setStep('interview')
      setMessages([])
      messagesRef.current = []
      await initInterview(randomCandidate)
    } else {
      // 跳转到候选人选择页面
      Taro.navigateTo({ url: '/pages/hr-sim/candidates?mode=select' })
    }
  }, [initInterview])

  // 菜单阶段
  if (step === 'menu') {
    return (
      <View className='min-h-screen' style={{ backgroundColor: '#F8F9F7', paddingTop: statusBarHeight }}>
        <View className='px-6 pt-6 pb-4 flex flex-row items-center'>
          <Button variant='ghost' size='icon' className='mr-2' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
            <ArrowLeft size={20} color='#3A4A44' />
          </Button>
          <Text className='text-2xl font-bold' style={{ color: '#3A4A44' }}>HR反向模拟</Text>
        </View>

        <View className='px-6 pt-4'>
          <Card className='mb-6' style={{ backgroundColor: '#FFFFFF' }}>
            <CardContent className='p-6'>
              <View className='flex flex-row items-center mb-4'>
                <Swords size={24} color='#3A4A44' className='mr-3' />
                <Text className='text-lg font-semibold' style={{ color: '#3A4A44' }}>
                  你是面试官
                </Text>
              </View>
              <Text className='block text-base' style={{ color: '#6B7280' }}>
                选择一位候选人，模拟真实的面试场景，体验面试官视角。
              </Text>
            </CardContent>
          </Card>

          <Button
            className='w-full h-16 text-base font-medium mb-4'
            style={{ backgroundColor: '#3A4A44' }}
            onClick={() => startInterview(false)}
          >
            <Text className='text-white'>从候选人库选择</Text>
          </Button>

          <Button
            className='w-full h-16 text-base font-medium'
            variant='outline'
            style={{ borderColor: '#3A4A44' }}
            onClick={() => startInterview(true)}
          >
            <Text style={{ color: '#3A4A44' }}>随机匹配候选人</Text>
          </Button>
        </View>
      </View>
    )
  }

  // 面试阶段
  return (
    <View className='min-h-screen' style={{ backgroundColor: '#F8F9F7', paddingTop: statusBarHeight }}>
      <View className='px-6 pt-4 pb-2 flex flex-row items-center' style={{ backgroundColor: '#FFFFFF' }}>
        <Button variant='ghost' size='icon' className='mr-2' onClick={() => setStep('menu')}>
          <ArrowLeft size={20} color='#3A4A44' />
        </Button>
        <View className='flex-1'>
          <Text className='block text-lg font-semibold' style={{ color: '#3A4A44' }}>
            {candidate?.name || '面试'}
          </Text>
          {candidate && (
            <Text className='block text-sm' style={{ color: '#6B7280' }}>
              {candidate.school} · {candidate.major}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        className='flex-1 px-4 pt-4 pb-4'
        scrollY
        scrollIntoView={scrollRef.current}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`flex flex-row mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <View className='w-10 h-10 rounded-full flex items-center justify-center mr-3' style={{ backgroundColor: '#E5E7EB' }}>
                <Bot size={20} color='#3A4A44' />
              </View>
            )}
            <View
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'rounded-tr-sm'
                  : 'rounded-tl-sm'
              }`}
              style={{
                backgroundColor: msg.role === 'user' ? '#3A4A44' : '#FFFFFF',
              }}
            >
              <Text
                className='block text-base leading-relaxed'
                style={{ color: msg.role === 'user' ? '#FFFFFF' : '#3A4A44' }}
              >
                {msg.content || (msg.isThinking ? '...' : '')}
              </Text>
              {msg.isThinking && (
                <View className='flex flex-row items-center mt-2'>
                  <Loader size={14} color={msg.role === 'user' ? '#FFFFFF' : '#3A4A44'} className='animate-spin mr-1' />
                  <Text
                    className='text-xs'
                    style={{ color: msg.role === 'user' ? '#FFFFFF' : '#6B7280' }}
                  >
                    思考中...
                  </Text>
                </View>
              )}
            </View>
            {msg.role === 'user' && (
              <View className='w-10 h-10 rounded-full flex items-center justify-center ml-3' style={{ backgroundColor: '#E5E7EB' }}>
                <User size={20} color='#3A4A44' />
              </View>
            )}
          </View>
        ))}

        {/* 键盘占位，确保输入框在键盘上方 */}
        {keyboardHeight > 0 && (
          <View style={{ height: keyboardHeight }} />
        )}
      </ScrollView>

      <View
        className='px-4 pb-4 pt-2 flex flex-row items-end'
        style={{
          backgroundColor: '#FFFFFF',
          paddingBottom: Math.max(16, keyboardHeight + 8),
        }}
      >
        <View className='flex-1 mr-3 px-4 py-2 rounded-2xl' style={{ backgroundColor: '#F3F4F6' }}>
          <TaroInput
            className='w-full text-base'
            style={{ color: '#3A4A44', minHeight: 20 }}
            placeholder='输入你的问题...'
            value={input}
            onInput={(e) => setInput(e.detail.value)}
            onConfirm={sendMessage}
            adjustPosition={false}
            confirmType='send'
          />
        </View>
        <Button
          size='icon'
          className='w-12 h-12 rounded-full'
          style={{ backgroundColor: '#3A4A44' }}
          disabled={!input.trim() || isLoading}
          onClick={sendMessage}
        >
          <Send size={20} color='#FFFFFF' />
        </Button>
      </View>
    </View>
  )
}

export default HrSimIndex

export const config = typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationStyle: 'custom',
    })
  : { navigationStyle: 'custom' }