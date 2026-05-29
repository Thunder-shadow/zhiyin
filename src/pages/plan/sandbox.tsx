import { View, Text, ScrollView, Input as TaroInput } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Bot, User, Compass, Loader } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
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

export default function PlanSandbox() {
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
        action: 'career_plan',
        prompt: userMsg.content,
        conversation: conversationForApi,
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
              ? { ...msg, content: '抱歉，AI暂时无法回复，请稍后再试...', isThinking: false }
              : msg
          )
          setMessages([...messagesRef.current])
        },
      })
    } catch {
      // 更新提示
      messagesRef.current = messagesRef.current.map(msg =>
        msg.id === aiMsg.id
          ? { ...msg, content: '抱歉，AI暂时无法回复，请稍后再试...', isThinking: false }
          : msg
      )
      setMessages([...messagesRef.current])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, scrollToBottom])

  return (
    <View className='min-h-screen' style={{ backgroundColor: '#F8F9F7' }}>
      {/* 自定义导航栏 */}
      <View className='flex items-center px-4' style={{ paddingTop: statusBarHeight, height: 44 + statusBarHeight, backgroundColor: '#F8F9F7' }}>
        <View className='w-10 h-10 rounded-full flex items-center justify-center mr-3' style={{ backgroundColor: 'rgba(58, 74, 68, 0.1)' }}>
          <Compass size={20} color='#3A4A44' />
        </View>
        <View>
          <Text className='block text-xl font-bold' style={{ color: '#3A4A44' }}>职业沙盘</Text>
          <Text className='block text-xs' style={{ color: '#89938F' }}>探索你的职业发展路径</Text>
        </View>
      </View>

      <View className='px-4 pb-4'>
        {messages.length === 0 ? (
          <>
            {/* 空状态 */}
            <Card>
              <CardContent className='p-6'>
                <View className='flex items-center justify-center mb-4'>
                  <View className='w-16 h-16 rounded-full flex items-center justify-center' style={{ backgroundColor: 'rgba(58, 74, 68, 0.1)' }}>
                    <Compass size={32} color='#3A4A44' />
                  </View>
                </View>
                <Text className='block text-center text-lg font-bold mb-2' style={{ color: '#3A4A44' }}>欢迎来到职业沙盘</Text>
                <Text className='block text-center text-sm mb-6' style={{ color: '#89938F' }}>告诉我你的职业目标，我来为你规划路径</Text>
                <View className='space-y-2'>
                  <Button className='w-full' variant='outline' onClick={() => {
                    setInput('我想成为一名产品经理')
                  }}
                  >
                    <Text style={{ color: '#3A4A44' }}>我想成为一名产品经理</Text>
                  </Button>
                  <Button className='w-full' variant='outline' onClick={() => {
                    setInput('我是计算机专业的学生，想了解职业发展')
                  }}
                  >
                    <Text style={{ color: '#3A4A44' }}>我是计算机专业的学生</Text>
                  </Button>
                  <Button className='w-full' variant='outline' onClick={() => {
                    setInput('帮我分析一下我的职业优势')
                  }}
                  >
                    <Text style={{ color: '#3A4A44' }}>分析我的职业优势</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* 聊天界面 */}
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
                    placeholder='告诉我你的职业目标...'
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
