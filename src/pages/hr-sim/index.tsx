// eslint-disable-next-line no-restricted-syntax -- 聊天输入框需使用原生 Input 以支持 adjustPosition={false} 防止键盘推页面
import { View, Text, ScrollView, Input as TaroInput } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Send, FileCheck, User, Bot, Eye, BookOpen, ChevronRight } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useRef, useCallback } from 'react'
import { Network } from '@/network'
import { fetchStream } from '@/utils/stream'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

const RESUME_PROFILES = [
  { name: '张明', school: '北京大学·计算机', summary: '3段大厂实习，GPA 3.8', tag: '技术型', color: '#3B82F6' },
  { name: '李华', school: '中山大学·市场营销', summary: '1段创业，学生会主席', tag: '社交型', color: '#8B5CF6' },
  { name: '王芳', school: '复旦·金融学', summary: '2段投行实习，英语专八', tag: '综合型', color: '#10B981' },
]

export default function HrSim() {
  const [step, setStep] = useState<'select' | 'interview' | 'result'>('select')
  const [resumeIndex, setResumeIndex] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hrNotes, setHrNotes] = useState('')
  const scrollRef = useRef('')
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  /** 滚动到底部 */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current = Date.now().toString()
    }, 50)
  }, [])

  /** 键盘弹起时仅滚动聊天区 + 记录键盘高度 */
  const handleInputFocus = useCallback(() => {
    scrollToBottom()
  }, [scrollToBottom])

  const handleKeyboardHeight = useCallback((e) => {
    const h = e.height || 0
    setKeyboardHeight(h)
    if (h > 0) scrollToBottom()
  }, [scrollToBottom])

  /** 开始面试 */
  const startInterview = async (index: number) => {
    setResumeIndex(index)
    setStep('interview')
    setMessages([])
    setIsLoading(true)

    const newMessages: ChatMessage[] = []

    await fetchStream(
      '/api/ai/chat/stream',
      { action: 'hr_sim_response', resume_index: index, conversation: [] },
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
            newMessages.push({ role: 'assistant', content: '候选人准备中，请稍后再试...' })
          }
          setMessages([...newMessages])
          setIsLoading(false)
        },
      }
    )
  }

  /** 发送问题 - 流式 */
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const currentConversation = [...messages, userMsg]
    setMessages(currentConversation)
    setInput('')
    setIsLoading(true)

    const aiMsg: ChatMessage = { role: 'assistant', content: '', streaming: true }
    const newMessages = [...currentConversation, aiMsg]
    setMessages([...newMessages])

    await fetchStream(
      '/api/ai/chat/stream',
      {
        action: 'hr_sim_response',
        resume_index: resumeIndex,
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
          aiMsg.content = '候选人暂时无法回复，请稍后再试...'
          aiMsg.streaming = false
          newMessages[newMessages.length - 1] = { ...aiMsg }
          setMessages([...newMessages])
          setIsLoading(false)
        },
      }
    )
  }

  /** 结束模拟 */
  const endSimulation = async () => {
    setIsLoading(true)
    try {
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          action: 'hr_sim_response',
          resume_index: resumeIndex,
          end: true,
          conversation: messages.map(m => ({ role: m.role, content: m.content }))
        }
      })
      console.log('HR sim end response:', res.data)
      const data = res.data?.data || res.data
      setHrNotes(data?.hr_notes || data?.message || '招聘笔记生成失败')
      setStep('result')
    } catch (err) {
      console.error('End simulation error:', err)
      setHrNotes('招聘笔记生成失败，请稍后再试')
      setStep('result')
    } finally {
      setIsLoading(false)
    }
  }

  /** 选择简历阶段 */
  if (step === 'select') {
    return (
      <View className="min-h-full bg-background px-4 pt-6">
        <View className="flex flex-row items-center gap-2 mb-6">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="var(--color-primary)" />
          </View>
          <Text className="block text-xl font-bold text-foreground">HR反向模拟</Text>
        </View>

        <View className="mb-4">
          <Text className="block text-sm text-muted-foreground mb-1">选择候选人简历</Text>
          <Text className="block text-xs text-muted-foreground" style={{ opacity: 0.6 }}>你将扮演HR面试这位候选人，考察你的选人眼光</Text>
        </View>

        {RESUME_PROFILES.map((profile, idx) => (
          <Card
            key={idx}
            className="mb-3 shadow-card"
            onClick={() => startInterview(idx)}
          >
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-3">
                <View
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${profile.color}15` }}
                >
                  <User size={24} color={profile.color} />
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex flex-row items-center gap-2">
                    <Text className="block font-semibold text-foreground">{profile.name}</Text>
                    <Badge className="text-xs border-none" style={{ backgroundColor: `${profile.color}15`, color: profile.color }}>{profile.tag}</Badge>
                  </View>
                  <Text className="block text-xs text-muted-foreground mt-1">{profile.school}</Text>
                  <Text className="block text-xs text-muted-foreground mt-1" style={{ opacity: 0.7 }}>{profile.summary}</Text>
                </View>
                <View className="flex-shrink-0">
                  <ChevronRight size={16} color="#6B7B74" />
                </View>
              </View>
            </CardContent>
          </Card>
        ))}
      </View>
    )
  }

  /** 结果阶段 */
  if (step === 'result') {
    return (
      <View className="min-h-full bg-background px-4 pt-6">
        <View className="flex flex-row items-center gap-2 mb-6">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="var(--color-primary)" />
          </View>
          <Text className="block text-xl font-bold text-foreground">招聘笔记</Text>
        </View>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <View className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#05966910' }}>
                <FileCheck size={16} color="#059669" />
              </View>
              <Text className="block font-semibold text-foreground">你的评估 vs 真实情况</Text>
            </View>
            <Separator className="mb-3" />
            <Text className="block text-sm text-foreground leading-relaxed whitespace-pre-wrap">{hrNotes}</Text>
          </CardContent>
        </Card>

        <View className="mt-4">
          <Button className="w-full" onClick={() => { setStep('select'); setMessages([]); setHrNotes('') }}>
            <BookOpen size={16} color="#fff" />
            <Text>再来一轮</Text>
          </Button>
        </View>
      </View>
    )
  }

  /** 面试对话阶段 */
  return (
    <View className="flex flex-col" style={{ height: '100vh' }}>
      {/* 顶部固定导航栏 - 使用安全区域 */}
      <View
        className="flex-shrink-0 px-4 pb-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)', background: 'linear-gradient(135deg, #3A4A44 0%, #4A5E52 100%)' }}
      >
        <View className="flex flex-row items-center gap-3">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="block text-white font-bold text-base">HR模拟面试</Text>
            <Text className="block text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>候选人: {RESUME_PROFILES[resumeIndex].name}</Text>
          </View>
          <Badge className="border-none text-xs" style={{ backgroundColor: '#E26A5C', color: '#fff' }}>
            <Eye size={12} color="#fff" /> 评估中
          </Badge>
        </View>
      </View>

      {/* 聊天区 - 自动填充剩余高度 */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        scrollY
        scrollIntoView={scrollRef.current}
        scrollWithAnimation
      >
        {messages.map((msg, idx) => (
          <View key={idx} id={`msg-${idx}`} className="mb-3">
            {msg.role === 'assistant' ? (
              <View className="flex flex-row items-start gap-2" style={{ maxWidth: '85%' }}>
                <View
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#3A4A44' }}
                >
                  <Bot size={14} color="#fff" />
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
                <View
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#E26A5C' }}
                >
                  <Text className="text-white text-xs font-bold">HR</Text>
                </View>
                <Card className="shadow-card" style={{ backgroundColor: '#3A4A44' }}>
                  <CardContent className="p-3">
                    <Text className="block text-sm text-white leading-relaxed">{msg.content}</Text>
                  </CardContent>
                </Card>
              </View>
            )}
          </View>
        ))}

        {/* 仅在AI正在思考且最后一条是用户消息时显示loading */}
        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
          <View className="mb-3">
            <View className="flex flex-row items-start gap-2" style={{ maxWidth: '85%' }}>
              <View
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#3A4A44' }}
              >
                <Bot size={14} color="#fff" />
              </View>
              <Card className="shadow-card">
                <CardContent className="p-3">
                  <Text className="block text-xs text-muted-foreground">候选人思考中...</Text>
                </CardContent>
              </Card>
            </View>
          </View>
        )}
        {/* 底部锚点 */}
        <View id="msg-bottom-hr" style={{ height: '1px' }} />
        <View style={{ height: '80px' }} />
      </ScrollView>

      {/* 输入区 - 固定底部，跟随键盘高度 */}
      <View
        className="flex-shrink-0 px-3 pt-3 bg-card"
        style={{ paddingBottom: `max(env(safe-area-inset-bottom), 12px)`, borderTop: '1px solid var(--color-outline-variant)', marginBottom: `${keyboardHeight}px` }}
      >
        <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
          <View style={{ flex: 1, backgroundColor: 'var(--color-muted)', borderRadius: '20px', padding: '8px 12px' }}>
            <TaroInput
              style={{ width: '100%', fontSize: '14px', color: 'var(--color-foreground)', backgroundColor: 'transparent' }}
              placeholder="向候选人提问..."
              placeholderStyle="color: var(--color-muted-foreground)"
              value={input}
              onInput={(e) => setInput(e.detail.value)}
              onConfirm={sendMessage}
              confirmType="send"
              disabled={isLoading}
              adjustPosition={false}
              onFocus={handleInputFocus}
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

        {messages.length > 1 && (
          <View className="mt-2">
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={endSimulation}
              disabled={isLoading}
            >
              <FileCheck size={14} color="#3A4A44" />
              <Text>结束面试 · 查看招聘笔记</Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}
