// eslint-disable-next-line no-restricted-syntax -- 聊天输入框需使用原生 Input 以支持 adjustPosition 防止键盘推页面
import { View, Text, ScrollView, Input as TaroInput } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Bot, Sparkles } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useRef, useCallback } from 'react'
import { fetchStream } from '@/utils/stream'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** 获取系统状态栏高度 */
function getStatusBarHeight(): number {
  try {
    const sysInfo = Taro.getSystemInfoSync()
    return sysInfo.statusBarHeight || 0
  } catch {
    return 0
  }
}

export default function PlanSandbox() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef('')
  const statusBarHeight = getStatusBarHeight()

  const scrollToBottom = useCallback(() => {
    scrollRef.current = 'scroll-' + Date.now()
    setTimeout(() => {
      Taro.pageScrollTo({ scrollTop: 99999, duration: 100 }).catch(() => {})
    }, 50)
  }, [])

  /** 发送消息 - 使用流式 API */
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const currentConversation = [...messages, userMsg]
    setInput('')
    setIsLoading(true)
    setMessages(currentConversation)

    const aiMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages([...currentConversation, { ...aiMsg }])
    scrollToBottom()

    await fetchStream(
      '/api/ai/chat/stream',
      {
        action: 'career_plan',
        conversation: currentConversation.map(m => ({ role: m.role, content: m.content }))
      },
      {
        onChunk: (content) => {
          aiMsg.content += content
          setMessages([...currentConversation, { ...aiMsg }])
          scrollToBottom()
        },
        onDone: () => {
          setMessages([...currentConversation, { ...aiMsg }])
          setIsLoading(false)
        },
        onError: () => {
          setMessages([...currentConversation, { role: 'assistant', content: '抱歉，AI暂时无法回复，请稍后再试...' }])
          setIsLoading(false)
        },
      }
    )
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
          <View className='w-10 h-10 rounded-full flex items-center justify-center mr-1' style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Sparkles size={20} color='#fff' />
          </View>
          <View>
            <Text className='block text-white font-bold text-base'>职业沙盘</Text>
            <Text className='block text-sm' style={{ color: 'rgba(255,255,255,0.7)' }}>AI职业导航师</Text>
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
        {/* 欢迎卡片 */}
        {messages.length === 0 && (
          <Card className='mb-4' style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #F0F4F2 0%, #E8EDE9 100%)' }}>
            <CardContent className='p-5'>
              <View className='flex flex-row items-center gap-3 mb-3'>
                <View className='w-12 h-12 rounded-full flex items-center justify-center' style={{ background: 'linear-gradient(135deg, #3A4A44 0%, #4A5E52 100%)' }}>
                  <Sparkles size={24} color='#fff' />
                </View>
                <View className='flex-1'>
                  <Text className='block text-base font-semibold' style={{ color: '#3A4A44' }}>欢迎来到职业沙盘</Text>
                  <Text className='block text-sm' style={{ color: '#666' }}>我是你的职业导航师</Text>
                </View>
              </View>
              <Text className='block text-sm' style={{ color: '#666', lineHeight: '22px' }}>
                告诉我你的专业、兴趣、性格特点，我可以帮你规划职业发展路径。
              </Text>
            </CardContent>
          </Card>
        )}

        {messages.map((msg) => (
          <View
            key={msg.role + '-' + msg.content.slice(0, 20)}
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
            </View>
            {msg.role === 'user' && (
              <View className='w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0'>
                <Text className='text-xs font-medium' style={{ color: '#666' }}>你</Text>
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
              <Text className='block text-xs animate-pulse' style={{ color: '#999' }}>导航师思考中...</Text>
            </View>
          </View>
        )}

        <View id={scrollRef.current} className='h-4' />
      </ScrollView>

      {/* 输入区 */}
      <View
        className='flex-shrink-0 px-4 py-3'
        style={{ background: '#fff', borderTop: '1px solid #eee' }}
      >
        <View
          className='flex flex-row items-center px-4 py-2 rounded-full'
          style={{ background: '#F5F5F5' }}
        >
          <TaroInput
            className='flex-1 text-sm'
            style={{ minHeight: '36px', lineHeight: '36px' }}
            placeholder='告诉我你的专业和兴趣...'
            value={input}
            onInput={(e) => setInput(e.detail.value)}
            disabled={isLoading}
            adjustPosition={false}
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
