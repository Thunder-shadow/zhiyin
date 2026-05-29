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
  streaming?: boolean
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
    scrollRef.current = Date.now().toString()
    // Backup: use Taro.pageScrollTo
    setTimeout(() => {
      Taro.pageScrollTo({ scrollTop: 99999, duration: 100 }).catch(() => {})
    }, 50)
  }, [])

  /** 发送消息 - 流式 */
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
        action: 'career_plan',
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
          setMessages([...currentConversation, { role: 'assistant', content: 'AI暂时无法回复，请稍后再试...', streaming: false }])
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
        className='flex-shrink-0'
        style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '12px', paddingTop: `${statusBarHeight + 8}px`, background: 'linear-gradient(135deg, #3A4A44 0%, #4A5E52 100%)' }}
      >
        <View className='flex flex-row items-center gap-3'>
          <View className='flex-1 min-w-0'>
            <Text className='block text-white font-bold text-base'>职业沙盘</Text>
            <Text className='block text-sm' style={{ color: 'rgba(255,255,255,0.7)' }}>AI帮你规划职业路径</Text>
          </View>
          <View className='w-8 h-8 rounded-full flex items-center justify-center' style={{ backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            <Sparkles size={14} color='#fff' />
          </View>
        </View>
      </View>

      {/* 聊天区 */}
      <ScrollView
        className='flex-1'
        style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}
        scrollY
        scrollIntoView={scrollRef.current}
        scrollWithAnimation
      >
        {messages.length === 0 && (
          <View className='flex items-center justify-center pt-16'>
            <Card className='shadow-card w-full'>
              <CardContent className='p-6 text-center'>
                <View className='w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center' style={{ backgroundColor: '#8B5CF615', overflow: 'hidden' }}>
                  <Sparkles size={32} color='#8B5CF6' />
                </View>
                <Text className='block text-lg font-bold text-foreground mb-2'>职业沙盘</Text>
                <Text className='block text-sm text-muted-foreground mb-1'>告诉我你的职业困惑，AI帮你分析</Text>
                <Text className='block text-xs text-muted-foreground' style={{ opacity: 0.6 }}>例如：&ldquo;我是前端开发，想转产品经理，该怎么规划？&rdquo;</Text>
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
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                <Card className='shadow-card' style={{ backgroundColor: '#3A4A44', maxWidth: '75%' }}>
                  <CardContent className='p-3'>
                    <Text className='block text-sm text-white leading-relaxed'>{msg.content}</Text>
                  </CardContent>
                </Card>
                <View
                  className='w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0'
                  style={{ backgroundColor: '#6B7B74', overflow: 'hidden' }}
                >
                  <Text className='text-white text-xs font-bold'>我</Text>
                </View>
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
                  <Text className='block text-xs text-muted-foreground'>AI思考中...</Text>
                </CardContent>
              </Card>
            </View>
          </View>
        )}
        <View id='msg-bottom-sandbox' style={{ height: '1px' }} />
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
              placeholder='描述你的职业困惑...'
              placeholderStyle='color: var(--color-muted-foreground)'
              value={input}
              onInput={(e) => setInput(e.detail.value)}
              onConfirm={sendMessage}
              confirmType='send'
              disabled={isLoading}
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
              disabled={!input.trim() || isLoading}
            >
              <Send size={16} color='#fff' />
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
