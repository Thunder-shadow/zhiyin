import { View, Text, ScrollView } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Swords, Send, ArrowLeft, Zap } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useRef, useEffect } from 'react'
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

  const typeLabel = type === 'stress' ? '压力面' : type === 'group' ? '群面' : '单面'

  useEffect(() => {
    startInterview()
  }, [])

  const scrollToBottom = () => {
    scrollRef.current = Date.now().toString()
  }

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
        onError: (_msg) => {
          if (newMessages.length === 0) {
            newMessages.push({ role: 'assistant', content: '面试官似乎走神了，请再试一次...' })
          }
          setMessages([...newMessages])
          setIsLoading(false)

        },
      }
    )

  }

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
        onError: (_msg) => {
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
    <View className="flex flex-col h-screen bg-background">
      {/* 顶部导航栏 */}
      <View className="bg-primary px-4 pt-4 pb-3 rounded-b-2xl">
        <View className="flex flex-row items-center gap-3">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="block text-white font-bold text-base">面试训练</Text>
            <Text className="block text-gray-300 text-xs">{typeLabel}模式 · 第{roundCount + 1}轮</Text>
          </View>
          <Badge className="bg-accent text-white border-none text-xs badge-glow">
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
          <View
            key={idx}
            id={`msg-${idx}`}
            className={`mb-3 ${msg.role === 'user' ? 'anim-slide-in-right' : 'anim-slide-in-left'}`}
          >
            {msg.role === 'assistant' ? (
              <View className="flex flex-row items-start gap-2 max-w-[85%]">
                <View className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <Swords size={14} color="#fff" />
                </View>
                <Card className="shadow-sm">
                  <CardContent className="p-3">
                    <Text className="block text-sm text-foreground leading-relaxed">
                      {msg.content}
                      {msg.streaming && <Text className="inline-block w-2 h-4 bg-primary ml-1 align-middle cursor-blink" />}
                    </Text>
                  </CardContent>
                </Card>
              </View>
            ) : (
              <View className="flex flex-row items-start gap-2 max-w-[85%] ml-auto flex-row-reverse">
                <View className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                  <Text className="text-white text-xs font-bold">我</Text>
                </View>
                <Card className="shadow-sm bg-primary">
                  <CardContent className="p-3">
                    <Text className="block text-sm text-white leading-relaxed">{msg.content}</Text>
                  </CardContent>
                </Card>
              </View>
            )}
          </View>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <View className="mb-3 anim-slide-in-left">
            <View className="flex flex-row items-start gap-2 max-w-[85%]">
              <View className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <Swords size={14} color="#fff" />
              </View>
              <Card className="shadow-sm">
                <CardContent className="p-3">
                  <View className="flex flex-row items-center gap-1">
                    <View className="w-2 h-2 bg-primary rounded-full dot-typewriter" />
                    <View className="w-2 h-2 bg-primary rounded-full dot-typewriter" style={{ animationDelay: '0.2s' }} />
                    <View className="w-2 h-2 bg-primary rounded-full dot-typewriter" style={{ animationDelay: '0.4s' }} />
                  </View>
                </CardContent>
              </Card>
            </View>
          </View>
        )}

        {/* 底部锚点 */}
        <View id="msg-bottom" />
      </ScrollView>

      {/* 底部输入区 */}
      <View
        style={{
          display: 'flex', flexDirection: 'row', gap: '8px',
          padding: '12px', backgroundColor: '#fff',
          borderTop: '1px solid #e5e5e5', alignItems: 'center'
        }}
      >
        <View style={{ flex: 1, backgroundColor: '#f5f5f5', borderRadius: '20px', padding: '8px 12px' }}>
          <Input
            style={{ width: '100%', fontSize: '14px' }}
            placeholder="输入你的回答..."
            value={input}
            onInput={(e) => setInput(e.detail.value)}
            onConfirm={sendMessage}
            confirmType="send"
            disabled={isLoading}
          />
        </View>
        <View style={{ flexShrink: 0 }}>
          <Button
            size="sm"
            className="btn-shimmer"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Send size={16} color="#fff" />
          </Button>
        </View>
      </View>

      {/* 结束面试按钮 */}
      {roundCount > 0 && (
        <View
          style={{
            padding: '8px 16px 16px', backgroundColor: '#fff',
            display: 'flex', justifyContent: 'center'
          }}
        >
          <Button variant="outline" className="w-full btn-hover-lift" onClick={endInterview}>
            <Zap size={14} color="#6366F1" />
            <Text>结束面试 · 查看报告</Text>
          </Button>
        </View>
      )}
    </View>
  )
}
