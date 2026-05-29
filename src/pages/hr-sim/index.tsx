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
              ? { ...msg, content: '抱歉，面试官暂时无法启动...', isThinking: false }
              : msg
          )
          setMessages([...messagesRef.current])
        },
      })
    } catch {
      // 更新提示
      messagesRef.current = messagesRef.current.map(msg =>
        msg.id === tempId
          ? { ...msg, content: '抱歉，面试官暂时无法启动...', isThinking: false }
          : msg
      )
      setMessages([...messagesRef.current])
    } finally {
      setIsLoading(false)
    }
  }, [scrollToBottom])

  // 处理 URL 参数中的 candidateId
  useEffect(() => {
    const candidateId = router.params?.candidateId
    if (candidateId && candidateId !== 'random') {
      Taro.navigateTo({ url: '/pages/hr-sim/candidates?selectedId=' + candidateId })
    }
  }, [router.params])

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
              ? { ...msg, content: '抱歉，面试官暂时无法回复，请稍后再试...', isThinking: false }
              : msg
          )
          setMessages([...messagesRef.current])
        },
      })
    } catch {
      // 更新提示
      messagesRef.current = messagesRef.current.map(msg =>
        msg.id === aiMsg.id
          ? { ...msg, content: '抱歉，面试官暂时无法回复，请稍后再试...', isThinking: false }
          : msg
      )
      setMessages([...messagesRef.current])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, candidate, scrollToBottom])

  // 随机生成一个候选人
  const randomCandidate: typeof candidate = {
    id: 'random-' + Date.now(),
    name: '测试候选人',
    school: '测试学校',
    major: '测试专业',
    background: '暂无',
    personality: '暂无',
    realLevel: 'B',
    color: '#3A4A44',
  }

  return (
    <View className='min-h-screen' style={{ backgroundColor: '#F8F9F7' }}>
      {/* 自定义导航栏 */}
      <View className='flex items-center px-4' style={{ paddingTop: statusBarHeight, height: 44 + statusBarHeight, backgroundColor: '#F8F9F7' }}>
        {step === 'interview' && (
          <Button
            variant='ghost'
            size='icon'
            className='mr-2'
            onClick={() => {
              setStep('menu')
              setCandidate(null)
              setMessages([])
            }}
          >
            <ArrowLeft size={20} color='#3A4A44' />
          </Button>
        )}
        <Text className='block text-xl font-bold' style={{ color: '#3A4A44' }}>
          {step === 'menu' ? 'HR 反向模拟' : '面试进行中'}
        </Text>
      </View>

      <View className='px-4 pb-4'>
        {step === 'menu' ? (
          <>
            {/* 入口卡片 */}
            <Card className='mb-4'>
              <CardContent className='p-6'>
                <View className='flex items-center mb-4'>
                  <View className='w-12 h-12 rounded-full flex items-center justify-center mr-4' style={{ backgroundColor: 'rgba(58, 74, 68, 0.1)' }}>
                    <Swords size={24} color='#3A4A44' />
                  </View>
                  <View>
                    <Text className='block text-lg font-bold' style={{ color: '#3A4A44' }}>HR 反向模拟</Text>
                    <Text className='block text-sm' style={{ color: '#89938F' }}>体验求职者视角的面试</Text>
                  </View>
                </View>
                <View className='flex gap-3'>
                  <Button className='flex-1' style={{ backgroundColor: '#3A4A44' }} onClick={() => {
                    setCandidate(randomCandidate)
                    setStep('interview')
                    initInterview(randomCandidate)
                  }}
                  >
                    <Text className='text-white'>随机开始</Text>
                  </Button>
                  <Button className='flex-1' variant='outline' onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/candidates' })}>
                    <Text style={{ color: '#3A4A44' }}>选择候选人</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <Text className='block text-base font-bold mb-2' style={{ color: '#3A4A44' }}>玩法说明</Text>
                <Text className='block text-sm mb-1' style={{ color: '#89938F' }}>• 你扮演面试官，AI 扮演求职者</Text>
                <Text className='block text-sm mb-1' style={{ color: '#89938F' }}>• 可以选择预设的求职者或随机生成</Text>
                <Text className='block text-sm mb-1' style={{ color: '#89938F' }}>• 练习你的面试技巧和提问能力</Text>
                <Text className='block text-sm' style={{ color: '#89938F' }}>• 结束后可查看面试报告和建议</Text>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* 面试聊天 */}
            <ScrollView
              className='h-96 mb-4 rounded-2xl p-4'
              style={{ backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(58, 74, 68, 0.1), 0 2px 4px -1px rgba(58, 74, 68, 0.06)' }}
              scrollY
              scrollIntoView={scrollRef.current}
              scrollWithAnimation
            >
              {messages.map((msg, _i) => (
                <View key={msg.id} className={`flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
                  <View className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'ml-3' : 'mr-3'}`} style={{ backgroundColor: msg.role === 'user' ? 'rgba(226, 106, 92, 0.1)' : 'rgba(58, 74, 68, 0.1)' }}>
                    {msg.role === 'user' ? <User size={16} color='#E26A5C' /> : <Bot size={16} color='#3A4A44' />}
                  </View>
                  <View className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'rounded-tr-md' : 'rounded-tl-md'}`} style={{ backgroundColor: msg.role === 'user' ? '#E26A5C' : '#fff', borderWidth: msg.role === 'user' ? 0 : 1, borderColor: 'rgba(58, 74, 68, 0.1)' }}>
                    {msg.isThinking && !msg.content ? (
                      <View className='flex items-center'>
                        <Loader size={16} color={msg.role === 'user' ? '#fff' : '#3A4A44'} />
                        <Text className='block ml-2 text-sm' style={{ color: msg.role === 'user' ? '#fff' : '#89938F' }}>思考中...</Text>
                      </View>
                    ) : (
                      <Text className='block' style={{ color: msg.role === 'user' ? '#fff' : '#3A4A44' }}>{msg.content}</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* 输入区域 */}
            <View className='rounded-2xl p-4' style={{ backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(58, 74, 68, 0.1), 0 2px 4px -1px rgba(58, 74, 68, 0.06)', paddingBottom: Math.max(16, 16 + keyboardHeight / 2) }}>
              <View className='flex flex-row gap-3'>
                <View className='flex-1 rounded-2xl px-4' style={{ backgroundColor: '#F8F9F7' }}>
                  <TaroInput
                    className='w-full h-12 bg-transparent'
                    placeholder='向求职者提问...'
                    value={input}
                    onInput={(e) => setInput(e.detail.value)}
                    confirmType='send'
                    onConfirm={sendMessage}
                    adjustPosition={false}
                    disabled={isLoading}
                    style={{ fontSize: 16 }}
                  />
                </View>
                <Button size='icon' disabled={isLoading || !input.trim()} style={{ backgroundColor: '#3A4A44' }} onClick={sendMessage}>
                  <Send size={20} color='#fff' />
                </Button>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  )
}
