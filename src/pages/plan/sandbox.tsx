// eslint-disable-next-line no-restricted-syntax -- 聊天输入框需使用原生 Input 以支持 adjustPosition 防止键盘推页面
import { View, Text, ScrollView, Input as TaroInput } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Send, Bot, User, GraduationCap } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
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

export default function CareerSandbox() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const scrollRef = useRef('')
  const messagesRef = useRef<Message[]>([])
  const statusBarHeight = getStatusBarHeight()

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

  /** 发送消息 */
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
          action: 'career_plan',
          prompt: trimmed,
          conversation: messagesRef.current.filter(m => m.role === 'user').map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      })

      if (res.data && (res.data.data || res.data.message || res.data.content)) {
        const reply = res.data.data?.reply || res.data.data?.content || res.data.message || res.data.content || ''
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
            content: 'AI暂时无法回复，请稍后再试...',
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
          content: 'AI暂时无法回复，请稍后再试...',
          isThinking: false,
        }
      }
      setMessages([...messagesRef.current])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }, [input, isLoading, scrollToBottom])

  // 初始化消息
  useEffect(() => {
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是您的职业规划助手。我可以帮您分析职业发展方向、制定学习计划、解答职场困惑。请告诉我您目前的情况或想了解的职业问题。',
    }
    messagesRef.current = [welcomeMsg]
    setMessages([welcomeMsg])
  }, [])

  const handleBack = () => {
    Taro.navigateBack()
  }

  const lastMsg = messages[messages.length - 1]
  const showThinking = isLoading && messages.length > 0 && lastMsg?.role === 'user'

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
            <Text style={{ fontSize: '20px', color: '#fff' }}>←</Text>
          </Button>
          <View className='flex-1 min-w-0'>
            <Text className='block text-white font-bold text-base'>职业沙盘</Text>
            <Text className='block text-sm' style={{ color: 'rgba(255,255,255,0.7)' }}>AI职业规划助手</Text>
          </View>
          <View className='w-10 h-10 rounded-full flex items-center justify-center' style={{ background: 'rgba(255,255,255,0.2)' }}>
            <GraduationCap size={20} color='#fff' />
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
        {messages.map((msg) => (
          <View
            key={msg.id}
            id={`msg-${msg.id}`}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
          >
            {msg.role === 'assistant' && (
              <View className='w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0' style={{ background: 'linear-gradient(135deg, #3A4A44 0%, #4A5E52 100%)' }}>
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
                  AI思考中...
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
            <View className='w-8 h-8 rounded-full flex items-center justify-center mr-2' style={{ background: 'linear-gradient(135deg, #3A4A44 0%, #4A5E52 100%)' }}>
              <Bot size={18} color='#fff' />
            </View>
            <View className='px-4 py-3 rounded-2xl rounded-tl-sm' style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Text className='block text-xs' style={{ color: '#999' }}>AI思考中...</Text>
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
            placeholder='输入你的职业问题...'
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
