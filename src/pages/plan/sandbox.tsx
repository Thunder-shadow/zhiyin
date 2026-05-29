// eslint-disable-next-line no-restricted-syntax -- 聊天输入框需使用原生 Input 以支持 adjustPosition 防止键盘推页面
import { View, Text, ScrollView, Input as TaroInput } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Bot, Sparkles, Loader } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useRef, useCallback } from 'react'
import { Network } from '@/network'

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
    // 使用有效的 ID 格式（H5 端 ID 不能以数字开头）
    scrollRef.current = `scroll-${Date.now()}`
    // Backup: use Taro.pageScrollTo
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

    try {
      // 构建对话历史（不含最后一条用户消息，因为会在流中补充）
      const conversationHistory = currentConversation.map(m => ({ role: m.role, content: m.content }))

      // 使用流式 API
      const response = await Network.request({
        url: '/api/ai/chat/stream',
        method: 'POST',
        data: {
          action: 'career_plan',
          conversation: conversationHistory,
        },
      })

      // 处理流式响应
      const reader = response.data.getBody()
      const decoder = new TextDecoder('utf-8')
      let fullContent = ''

      // eslint-disable-next-line no-restricted-syntax
      for await (const chunk of reader) {
        const text = decoder.decode(chunk, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                fullContent += data.content
                // 更新消息内容
                setMessages(prev => {
                  const updated = [...prev]
                  const lastIdx = updated.length - 1
                  if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = { ...updated[lastIdx], content: fullContent }
                  }
                  return updated
                })
              }
            } catch {
              // 忽略 JSON 解析错误
            }
          }
        }
      }

      // 检查是否有错误响应
      if (!fullContent) {
        // 检查是否有 error 标记
        setMessages(prev => {
          const updated = [...prev]
          const lastIdx = updated.length - 1
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant' && !updated[lastIdx].content) {
            updated[lastIdx] = { ...updated[lastIdx], content: '抱歉，AI暂时无法回复，请稍后再试...' }
          }
          return updated
        })
      }
    } catch (err) {
      console.error('Career plan stream error:', err)
      // 显示友好错误消息
      setMessages(prev => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
          updated[lastIdx] = { ...updated[lastIdx], content: '抱歉，AI暂时无法回复，请稍后再试...' }
        }
        return updated
      })
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
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
        style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}
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
                    </Text>
                  </CardContent>
                </Card>
              </View>
            ) : (
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                <Card className='shadow-card' style={{ backgroundColor: '#3A4A44', maxWidth: '75%' }}>
                  <CardContent className='p-3'>
                    <Text className='block text-sm' style={{ color: '#fff' }}>
                      {msg.content}
                    </Text>
                  </CardContent>
                </Card>
              </View>
            )}
          </View>
        ))}

        {/* 思考中指示器 */}
        {showThinking && (
          <View className='flex flex-row items-center gap-2 mb-3' id='thinking-indicator'>
            <View
              className='w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0'
              style={{ backgroundColor: '#3A4A44', overflow: 'hidden' }}
            >
              <Bot size={14} color='#fff' />
            </View>
            <Card className='shadow-card'>
              <CardContent className='p-3'>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                  <Loader size={14} color='#8B5CF6' className='animate-spin' />
                  <Text className='block text-sm text-muted-foreground'>AI思考中...</Text>
                </View>
              </CardContent>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* 输入区 */}
      <View className='flex-shrink-0' style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', backgroundColor: '#fff', borderTopWidth: '1px', borderTopColor: '#E5E5E5' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
          <View style={{ flex: 1, backgroundColor: '#F5F5F5', borderRadius: '20px', padding: '10px 14px' }}>
            <TaroInput
              className='w-full'
              style={{ fontSize: '15px' }}
              value={input}
              onInput={(e) => setInput(e.detail.value)}
              placeholder='输入你的职业困惑...'
              placeholderClass='text-muted-foreground'
              disabled={isLoading}
              adjustPosition
            />
          </View>
          <View style={{ flexShrink: 0 }}>
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              size='icon'
              className='w-10 h-10 rounded-full'
              style={{ backgroundColor: isLoading || !input.trim() ? '#E5E5E5' : '#3A4A44', border: 'none' }}
            >
              {isLoading ? (
                <Loader size={18} color='#999' />
              ) : (
                <Send size={18} color='#fff' />
              )}
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
