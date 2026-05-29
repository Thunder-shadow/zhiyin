// eslint-disable-next-line no-restricted-syntax -- 聊天输入框需使用原生 Input 以支持 adjustPosition 防止键盘推页面
import { View, Text, ScrollView, Input as TaroInput } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Send, Bot, User } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useRef, useCallback } from 'react'
import { fetchStream } from '@/utils/stream'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

const MODES: Record<string, { title: string; label: string; action: string }> = {
  single: { title: '单人模拟面', label: 'AI面试官', action: 'interview_single' },
  pressure: { title: '压力面试', label: '严厉面试官', action: 'interview_pressure' },
  group: { title: 'AI群面', label: '群面官', action: 'interview_group' },
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

export default function InterviewRoom() {
  const mode = Taro.getCurrentInstance().router?.params?.mode || 'single'
  const modeInfo = MODES[mode] || MODES.single

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const scrollRef = useRef('')
  const statusBarHeight = getStatusBarHeight()

  const scrollToBottom = useCallback(() => {
    scrollRef.current = Date.now().toString()
    // Backup: use Taro.pageScrollTo
    setTimeout(() => {
      Taro.pageScrollTo({ scrollTop: 99999, duration: 100 }).catch(() => {})
    }, 50)
  }, [])

  /** 开始面试 */
  const startInterview = async () => {
    setIsLoading(true)
    setHasStarted(true)

    const newMessages: ChatMessage[] = []

    await fetchStream(
      '/api/ai/chat/stream',
      { action: modeInfo.action, position: '产品经理', company: '字节跳动' },
      {
        onChunk: (content) => {
          if (newMessages.length === 0) {
            newMessages.push({ role: 'assistant', content, streaming: true })
          } else {
            newMessages[0].content += content
          }
          setMessages([...newMessages])
          scrollToBottom()
        },
        onDone: () => {
          if (newMessages.length > 0) newMessages[0].streaming = false
          setMessages([...newMessages])
          setIsLoading(false)
        },
        onError: () => {
          if (newMessages.length === 0) {
            newMessages.push({ role: 'assistant', content: '面试官准备中，请稍后再试...' })
          }
          setMessages([...newMessages])
          setIsLoading(false)
        },
      }
    )
  }

  /** 发送回复 - 流式 */
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const currentConversation = [...messages, userMsg]
    setInput('')
    setIsLoading(true)
    setMessages(currentConversation)

    const aiMsg: ChatMessage = { role: 'assistant', content: '', streaming: true }

    await fetchStream(
      '/api/ai/chat/stream',
      {
        action: modeInfo.action,
        conversation: currentConversation.map(m => ({ role: m.role, content: m.content }))
      },
      {
        onChunk: (content) => {
          aiMsg.content += content
          aiMsg.streaming = true
          setMessages([...currentConversation, { ...aiMsg }])
          scrollToBottom()
        },
        onDone: () => {
          aiMsg.streaming = false
          setMessages([...currentConversation, { ...aiMsg }])
          setIsLoading(false)
        },
        onError: () => {
          setMessages([...currentConversation, { role: 'assistant', content: '面试官暂时无法回复，请稍后再试...', streaming: false }])
          setIsLoading(false)
        },
      }
    )
  }

  const lastMsg = messages[messages.length - 1]
  const showThinking = isLoading && messages.length > 0 && lastMsg?.role === 'user'

  return (
    <View className='flex flex-col' style={{ height: '100vh' }}>
      {/* 自定义顶部导航栏 */}
      <View
        className='flex-shrink-0 px-4 pb-3'
        style={{ paddingTop: `${statusBarHeight + 8}px`, background: 'linear-gradient(135deg, #3A4A44 0%, #4A5E52 100%)' }}
      >
        <View className='flex flex-row items-center gap-3'>
          <View onClick={() => Taro.navigateBack()} className='p-1'>
            <ArrowLeft size={20} color='#fff' />
          </View>
          <View className='flex-1 min-w-0'>
            <Text className='block text-white font-bold text-base'>{modeInfo.title}</Text>
            <Text className='block text-sm' style={{ color: 'rgba(255,255,255,0.7)' }}>{modeInfo.label}</Text>
          </View>
        </View>
      </View>

      {/* 聊天区 */}
      <ScrollView
        className='flex-1 px-4 pt-4'
        scrollY
        scrollIntoView={scrollRef.current}
        scrollWithAnimation
      >
        {!hasStarted && messages.length === 0 && (
          <View className='flex items-center justify-center pt-20'>
            <Card className='shadow-card w-full'>
              <CardContent className='p-6 text-center'>
                <View className='w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center' style={{ backgroundColor: '#3A4A4415', overflow: 'hidden' }}>
                  <Bot size={32} color='#3A4A44' />
                </View>
                <Text className='block text-lg font-bold text-foreground mb-2'>{modeInfo.title}</Text>
                <Text className='block text-sm text-muted-foreground mb-4'>AI将扮演{modeInfo.label}与你对话</Text>
                <Button className='w-full' style={{ backgroundColor: '#3A4A44' }} onClick={startInterview}>
                  <Text>开始面试</Text>
                </Button>
              </CardContent>
            </Card>
          </View>
        )}

        {messages.map((msg, idx) => (
          <View key={idx} id={`msg-${idx}`} className='mb-3'>
            {msg.role === 'assistant' ? (
              <View className='flex flex-row items-start gap-2' style={{ maxWidth: '85%' }}>
                <View
                  className='w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0'
                  style={{ backgroundColor: '#3A4A44', overflow: 'hidden' }}
                >
                  <Bot size={14} color='#fff' />
                </View>
                <Card className='shadow-card'>
                  <CardContent className='p-3'>
                    <Text className='block text-sm text-foreground leading-relaxed'>
                      {msg.content}
                      {msg.streaming && <Text className='inline-block w-2 h-4 ml-1' style={{ backgroundColor: '#3A4A44', animation: 'blink 1s step-end infinite' }} />}
                    </Text>
                  </CardContent>
                </Card>
              </View>
            ) : (
              <View className='flex flex-row items-start gap-2 ml-auto' style={{ maxWidth: '85%', flexDirection: 'row-reverse' }}>
                <View
                  className='w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0'
                  style={{ backgroundColor: '#E26A5C', overflow: 'hidden' }}
                >
                  <User size={14} color='#fff' />
                </View>
                <Card className='shadow-card' style={{ backgroundColor: '#3A4A44' }}>
                  <CardContent className='p-3'>
                    <Text className='block text-sm text-white leading-relaxed'>{msg.content}</Text>
                  </CardContent>
                </Card>
              </View>
            )}
          </View>
        ))}

        {showThinking && (
          <View className='mb-3' id='msg-thinking'>
            <View className='flex flex-row items-start gap-2' style={{ maxWidth: '85%' }}>
              <View className='w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0' style={{ backgroundColor: '#3A4A44', overflow: 'hidden' }}>
                <Bot size={14} color='#fff' />
              </View>
              <Card className='shadow-card'>
                <CardContent className='p-3'>
                  <Text className='block text-xs text-muted-foreground'>面试官思考中...</Text>
                </CardContent>
              </Card>
            </View>
          </View>
        )}
        <View id='msg-bottom-interview' style={{ height: '1px' }} />
        <View style={{ height: '80px' }} />
      </ScrollView>

      {/* 输入区 */}
      <View
        className='flex-shrink-0 px-3 pt-3 bg-card'
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)', borderTop: '1px solid var(--color-outline-variant)' }}
      >
        <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
          <View style={{ flex: 1, backgroundColor: 'var(--color-muted)', borderRadius: '20px', padding: '8px 12px' }}>
            <TaroInput
              style={{ width: '100%', fontSize: '14px', color: 'var(--color-foreground)', backgroundColor: 'transparent' }}
              placeholder='输入你的回答...'
              placeholderStyle='color: var(--color-muted-foreground)'
              value={input}
              onInput={(e) => setInput(e.detail.value)}
              onConfirm={sendMessage}
              confirmType='send'
              disabled={isLoading || !hasStarted}
              adjustPosition
              onFocus={scrollToBottom}
            />
          </View>
          <View style={{ flexShrink: 0 }}>
            <Button
              size='sm'
              className='rounded-full'
              style={{ backgroundColor: '#3A4A44' }}
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || !hasStarted}
            >
              <Send size={16} color='#fff' />
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
