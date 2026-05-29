// eslint-disable-next-line no-restricted-syntax -- 聊天输入框需使用原生 Input 以支持 adjustPosition={false} 防止键盘推页面
import { View, Text, ScrollView, Input as TaroInput } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Compass, Target, TrendingUp, Shield, ArrowLeft, Sparkles } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useRef, useCallback } from 'react'
import { fetchStream } from '@/utils/stream'

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  streaming?: boolean
}

/** 职业规划沙盘 - AI流式对话 + 画像 + 路径卡片 */
export default function Sandbox() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: '你好！我是你的职业导航师。告诉我你的专业、兴趣和目标，我会帮你规划最佳职业路径。' }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [pathData, setPathData] = useState<any[]>([])
  const [showResult, setShowResult] = useState(false)
  const scrollRef = useRef('')
  const [keyboardHeight, setKeyboardHeight] = useState(0)

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

  /** 流式发送消息 */
  const sendMessage = async () => {
    const trimmed = inputText.trim()
    if (!trimmed || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const currentMessages = [...messages, userMsg]
    setMessages(currentMessages)
    setInputText('')
    setIsLoading(true)

    const aiMsg: ChatMessage = { role: 'ai', content: '', streaming: true }
    const newMessages = [...currentMessages, aiMsg]
    setMessages([...newMessages])

    const conversation = currentMessages.map(m => ({
      role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
      content: m.content
    }))

    await fetchStream(
      '/api/ai/chat/stream',
      { action: 'career_plan', conversation },
      {
        onChunk: (content) => {
          aiMsg.content += content
          newMessages[newMessages.length - 1] = { ...aiMsg }
          setMessages([...newMessages])
          scrollToBottom()
        },
        onDone: (data) => {
          aiMsg.streaming = false
          newMessages[newMessages.length - 1] = { ...aiMsg }
          setMessages([...newMessages])
          setIsLoading(false)

          // 处理结构化数据
          if (data) {
            if (data.profile) setProfile(data.profile)
            if (data.paths) setPathData(data.paths)
            if (data.profile && data.paths) setShowResult(true)
          }
        },
        onError: () => {
          aiMsg.content = '抱歉，出了点问题，请再试一次。'
          aiMsg.streaming = false
          newMessages[newMessages.length - 1] = { ...aiMsg }
          setMessages([...newMessages])
          setIsLoading(false)
        },
      }
    )
  }

  return (
    <View className="flex flex-col" style={{ height: '100vh' }}>
      {/* 顶部 - 使用安全区域 */}
      <View
        className="flex-shrink-0 px-4 pb-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)', backgroundColor: '#7C3AED' }}
      >
        <View className="flex flex-row items-center gap-3">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex flex-row items-center gap-2">
              <Compass size={20} color="#fff" />
              <Text className="block text-white font-bold text-lg">职业规划沙盘</Text>
            </View>
            <Text className="block text-purple-200 text-xs mt-1">AI导航师帮你找到最佳职业路径</Text>
          </View>
          <Badge className="bg-accent text-white border-none text-xs">
            <Sparkles size={12} color="#fff" /> AI
          </Badge>
        </View>
      </View>

      {/* 对话区域 */}
      <ScrollView className="flex-1 px-4 py-4" scrollY scrollIntoView={scrollRef.current} scrollWithAnimation>
        {messages.map((msg, idx) => (
          <View
            key={idx}
            id={`msg-${idx}`}
            className={`flex flex-col mb-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.role === 'ai' ? (
              <View className="flex flex-row items-start gap-2" style={{ maxWidth: '85%' }}>
                <View className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#7C3AED' }}>
                  <Compass size={14} color="#fff" />
                </View>
                <Card className="shadow-card">
                  <CardContent className="p-3">
                    <Text className="block text-sm text-foreground leading-relaxed">
                      {msg.content}
                      {msg.streaming && <Text className="inline-block w-2 h-4 ml-1" style={{ backgroundColor: '#7C3AED', animation: 'blink 1s step-end infinite' }} />}
                    </Text>
                  </CardContent>
                </Card>
              </View>
            ) : (
              <View style={{ maxWidth: '85%' }}>
                <Card className="shadow-card" style={{ backgroundColor: '#7C3AED' }}>
                  <CardContent className="p-3">
                    <Text className="block text-sm text-white leading-relaxed">{msg.content}</Text>
                  </CardContent>
                </Card>
              </View>
            )}
          </View>
        ))}

        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
          <View className="flex flex-row items-start gap-2 mb-3">
            <View className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#7C3AED' }}>
              <Compass size={14} color="#fff" />
            </View>
            <Card className="shadow-card">
              <CardContent className="p-3">
                <Text className="block text-xs text-muted-foreground">导航师思考中...</Text>
              </CardContent>
            </Card>
          </View>
        )}

        {/* 画像 + 路径结果 */}
        {showResult && profile && (
          <Card className="shadow-card mt-4">
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-2 mb-3">
                <Shield size={16} color="#8B5CF6" />
                <Text className="block font-semibold text-foreground">你的职业画像</Text>
              </View>
              <View className="flex flex-col gap-2">
                {profile.strengths && (
                  <View>
                    <Text className="block text-xs text-muted-foreground mb-1">优势</Text>
                    <View className="flex flex-row flex-wrap gap-1">
                      {(profile.strengths as string[]).map((s: string, i: number) => (
                        <Badge key={i} className="bg-emerald-50 text-emerald-600 border-none text-xs">{s}</Badge>
                      ))}
                    </View>
                  </View>
                )}
                {profile.interests && (
                  <View>
                    <Text className="block text-xs text-muted-foreground mb-1">兴趣</Text>
                    <View className="flex flex-row flex-wrap gap-1">
                      {(profile.interests as string[]).map((s: string, i: number) => (
                        <Badge key={i} className="bg-blue-50 text-blue-600 border-none text-xs">{s}</Badge>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>
        )}

        {showResult && pathData.length > 0 && (
          <View className="mt-4">
            <Text className="block font-semibold text-foreground mb-2">推荐路径</Text>
            {pathData.map((path, idx) => (
              <Card key={idx} className="shadow-card mb-3">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center gap-2 mb-2">
                    <Target size={16} color="#FF6B35" />
                    <Text className="block font-semibold text-foreground">{path.name || `路径 ${idx + 1}`}</Text>
                    {path.fit_score && (
                      <Badge className="bg-accent text-white border-none text-xs">
                        {path.fit_score}%匹配
                      </Badge>
                    )}
                  </View>
                  <Text className="block text-sm text-muted-foreground leading-relaxed">{path.description || ''}</Text>
                  {path.milestones && (
                    <View className="mt-2 flex flex-col gap-1">
                      {(path.milestones as string[]).map((m: string, mi: number) => (
                        <View key={mi} className="flex flex-row items-center gap-2">
                          <TrendingUp size={12} color="#8B5CF6" />
                          <Text className="block text-xs text-muted-foreground">{m}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        )}
        <View id="msg-bottom-sandbox" style={{ height: '1px' }} />
        <View style={{ height: '80px' }} />
      </ScrollView>

      {/* 输入区域 - 跟随键盘高度 */}
      <View
        className="flex-shrink-0 px-3 pt-3 bg-card"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)', borderTop: '1px solid var(--color-outline-variant)', marginBottom: `${keyboardHeight}px` }}
      >
        <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
          <View style={{ flex: 1, backgroundColor: 'var(--color-muted)', borderRadius: '20px', padding: '8px 12px' }}>
            <TaroInput
              style={{ width: '100%', fontSize: '14px', color: 'var(--color-foreground)', backgroundColor: 'transparent' }}
              placeholder="告诉我你的职业目标..."
              placeholderStyle="color: var(--color-muted-foreground)"
              value={inputText}
              onInput={(e) => setInputText(e.detail.value)}
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
              style={{ backgroundColor: '#7C3AED' }}
              onClick={sendMessage}
              disabled={isLoading || !inputText.trim()}
            >
              <Send size={16} color="#fff" />
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
