// eslint-disable-next-line no-restricted-syntax -- 聊天输入框需使用原生 Input 以支持 adjustPosition={false} 防止键盘推页面
import { View, Text, ScrollView, Input as TaroInput } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Swords, Send, ArrowLeft, Zap } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useRef, useCallback } from 'react'
import { fetchStream } from '@/utils/stream'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export default function InterviewRoom() {
  const params = Taro.getCurrentInstance().router?.params || {}
  const type = (params.type as string) || 'single'

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef('')
  const [roundCount, setRoundCount] = useState(0)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  const typeLabel = type === 'stress' ? '压力面' : type === 'group' ? '群面' : '单面'

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current = Date.now().toString()
    }, 50)
  }, [])

  const handleKeyboardHeight = useCallback((e) => {
    const h = e.height || 0
    setKeyboardHeight(h)
    if (h > 0) scrollToBottom()
  }, [scrollToBottom])

  /** 开始面试 - 流式 */
  const startInterview = async () => {
    setIsLoading(true)
    const newMessages: ChatMessage[] = []
    setMessages([])
    setRoundCount(0)

    await fetchStream(
      '/api/ai/chat/stream',
      { action: 'interview_start', type, conversation: [] },
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
            newMessages.push({ role: 'assistant', content: '面试官似乎走神了，请再试一次...' })
          }
          setMessages([...newMessages])
          setIsLoading(false)
        },
      }
    )
  }

  // 初始化面试
  useState(() => {
    startInterview()
  })

  /** 发送消息 - 流式 */
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const currentConversation = [...messages, userMsg]
    setMessages(currentConversation)
    setInput('')
    setIsLoading(true)
    setRoundCount(prev => prev + 1)

    const aiMsg: ChatMessage = { role: 'assistant', content: '', streaming: true }
    const newMessages = [...currentConversation, aiMsg]
    setMessages([...newMessages])

    await fetchStream(
      '/api/ai/chat/stream',
      {
        action: 'interview_follow_up',
        type,
        conversation: currentConversation.map(m => ({ role: m.role, content: m.content }))
      },
      {
        onChunk: (content) => {
          aiMsg.content += content
          newMessages[newMessages.length - 1] = { ...aiMsg }
          setMessages([...newMessages])
          scrollToBottom()
        },
        onDone: () => {
          aiMsg.streaming = false
          newMessages[newMessages.length - 1] = { ...aiMsg }
          setMessages([...newMessages])
          setIsLoading(false)
        },
        onError: () => {
          aiMsg.content = '面试官似乎走神了，请再试一次...'
          aiMsg.streaming = false
          newMessages[newMessages.length - 1] = { ...aiMsg }
          setMessages([...newMessages])
          setIsLoading(false)
        },
      }
    )
  }

  /** 结束面试 */
  const endInterview = () => {
    Taro.navigateTo({
      url: `/pages/interview/report?type=${type}&rounds=${roundCount}`
    })
  }

  return (
    <View className="flex flex-col" style={{ height: '100vh' }}>
      {/* 顶部导航栏 */}
      <View
        className="flex-shrink-0 px-4 pb-3 rounded-b-2xl"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)', background: 'linear-gradient(135deg, #2D3A35 0%, #3A4A44 50%, #4A6A5C 100%)' }}
      >
        <View className="flex flex-row items-center gap-3">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="block text-white font-bold text-base">面试训练</Text>
            <Text className="block text-gray-300 text-xs">{typeLabel}模式 · 第{roundCount + 1}轮</Text>
          </View>
          <Badge className="bg-accent text-white border-none text-xs">
            <Swords size={12} color="#fff" /> 训练中
          </Badge>
        </View>
      </View>

      {/* 聊天区域 */}
      <ScrollView
        className="flex-1 px-4 pt-4 pb-2"
        scrollY
        scrollIntoView={scrollRef.current}
        scrollWithAnimation
      >
        {messages.map((msg, idx) => (
          <View key={idx} id={`msg-${idx}`} className="mb-3">
            {msg.role === 'assistant' ? (
              <View className="flex flex-row items-start gap-2" style={{ maxWidth: '85%' }}>
                <View className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3A4A44' }}>
                  <Swords size={14} color="#fff" />
                </View>
                <Card className="shadow-card">
                  <CardContent className="p-3">
                    <Text className="block text-sm text-foreground leading-relaxed">
                      {msg.content}
                      {msg.streaming && <Text className="inline-block w-2 h-4 ml-1" style={{ backgroundColor: '#3A4A44', animation: 'blink 1s step-end infinite' }} />}
                    </Text>
                  </CardContent>
                </Card>
              </View>
            ) : (
              <View className="flex flex-row items-start gap-2 ml-auto" style={{ maxWidth: '85%', flexDirection: 'row-reverse' }}>
                <View className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E26A5C' }}>
                  <Text className="text-white text-xs font-bold">我</Text>
                </View>
                <Card className="shadow-card" style={{ background: 'linear-gradient(135deg, #3A4A44, #4A6A5C)' }}>
                  <CardContent className="p-3">
                    <Text className="block text-sm text-white leading-relaxed">{msg.content}</Text>
                  </CardContent>
                </Card>
              </View>
            )}
          </View>
        ))}

        {/* AI正在思考时显示loading - 仅在最后一条是用户消息且正在加载时 */}
        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
          <View className="mb-3">
            <View className="flex flex-row items-start gap-2" style={{ maxWidth: '85%' }}>
              <View className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3A4A44' }}>
                <Swords size={14} color="#fff" />
              </View>
              <Card className="shadow-card">
                <CardContent className="p-3">
                  <Text className="block text-xs text-muted-foreground">面试官思考中...</Text>
                </CardContent>
              </Card>
            </View>
          </View>
        )}

        <View id="msg-bottom" style={{ height: '1px' }} />
        <View style={{ height: '80px' }} />
      </ScrollView>

      {/* 底部输入区 - 跟随键盘高度 */}
      <View
        className="flex-shrink-0 px-3 pt-3 bg-card"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)', borderTop: '1px solid var(--color-outline-variant)', marginBottom: `${keyboardHeight}px` }}
      >
        <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
          <View style={{ flex: 1, backgroundColor: 'var(--color-muted)', borderRadius: '20px', padding: '8px 12px' }}>
            <TaroInput
              style={{ width: '100%', fontSize: '14px', color: 'var(--color-foreground)', backgroundColor: 'transparent' }}
              placeholder="输入你的回答..."
              placeholderStyle="color: var(--color-muted-foreground)"
              value={input}
              onInput={(e) => setInput(e.detail.value)}
              onConfirm={sendMessage}
              confirmType="send"
              disabled={isLoading}
              adjustPosition={false}
              onFocus={scrollToBottom}
              onKeyboardHeightChange={handleKeyboardHeight}
            />
          </View>
          <View style={{ flexShrink: 0 }}>
            <Button
              size="sm"
              className="rounded-full"
              style={{ backgroundColor: '#3A4A44' }}
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
            >
              <Send size={16} color="#fff" />
            </Button>
          </View>
        </View>

        {/* 结束面试按钮 */}
        {roundCount > 0 && (
          <View className="mt-2">
            <Button variant="outline" className="w-full" onClick={endInterview}>
              <Zap size={14} color="#5B9A6F" />
              <Text>结束面试 · 查看报告</Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}
