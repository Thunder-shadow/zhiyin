import { View, Text, ScrollView } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Send, FileCheck, User, Bot, Eye, BookOpen, ChevronRight } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useRef, useEffect } from 'react'
import { Network } from '@/network'
import { fetchStream } from '@/utils/stream'
import { useKeyboardOffset } from '@/lib/hooks/use-keyboard-offset'

const AI_MAX_CHARS = 250

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
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef('')
  const keyboardOffset = useKeyboardOffset()

  useEffect(() => {
    setTimeout(() => setLoaded(true), 80)
  }, [])

  const scrollToBottom = () => {
    scrollRef.current = Date.now().toString()
  }

  /** 开始面试 */
  const startInterview = async (index: number) => {
    setResumeIndex(index)
    setStep('interview')
    setMessages([])
    setIsLoading(true)

    const newMessages: ChatMessage[] = []
    let reachedLimit = false

    await fetchStream(
      '/api/ai/chat/stream',
      { action: 'hr_sim_response', resume_index: index, conversation: [] },
      {
        onChunk: (content) => {
          if (reachedLimit) return
          if (newMessages.length === 0) {
            newMessages.push({ role: 'assistant', content: '', streaming: true })
          }
          const msg = newMessages[0]
          const remaining = AI_MAX_CHARS - msg.content.length
          if (remaining <= 0) {
            reachedLimit = true
            msg.streaming = false
            newMessages[0] = { ...msg }
            setMessages([...newMessages])
            setIsLoading(false)
            return
          }
          msg.content += content.substring(0, remaining)
          if (msg.content.length >= AI_MAX_CHARS) {
            reachedLimit = true
            msg.streaming = false
          }
          newMessages[0] = { ...msg }
          setMessages([...newMessages])
          scrollToBottom()
        },
        onDone: () => {
          if (newMessages.length > 0) {
            // Don't replace content if it already exists
            if (!newMessages[0].content || newMessages[0].content.trim() === '') {
              newMessages[0].content = '候选人思考中...'
            }
            newMessages[0].streaming = false
          }
          setMessages([...newMessages])
          setIsLoading(false)
        },
        onError: () => {
          if (newMessages.length === 0) {
            newMessages.push({ role: 'assistant', content: '候选人准备中，请稍后...' })
          } else if (!newMessages[0].content || newMessages[0].content.trim() === '') {
            // Only show error if no content was received
            newMessages[0].content = '候选人准备中，请稍后...'
          }
          if (newMessages.length > 0) newMessages[0].streaming = false
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

    let reachedLimit = false

    await fetchStream(
      '/api/ai/chat/stream',
      {
        action: 'hr_sim_response',
        resume_index: resumeIndex,
        conversation: currentConversation.map(m => ({ role: m.role, content: m.content }))
      },
      {
        onChunk: (content) => {
          if (reachedLimit) return
          const remaining = AI_MAX_CHARS - aiMsg.content.length
          if (remaining <= 0) {
            reachedLimit = true
            aiMsg.streaming = false
            newMessages[newMessages.length - 1] = { ...aiMsg }
            setMessages([...newMessages])
            setIsLoading(false)
            return
          }
          aiMsg.content += content.substring(0, remaining)
          if (aiMsg.content.length >= AI_MAX_CHARS) {
            reachedLimit = true
            aiMsg.streaming = false
          }
          newMessages[newMessages.length - 1] = { ...aiMsg }
          setMessages([...newMessages])
          scrollToBottom()
        },
        onDone: () => {
          // Don't replace content if it already exists
          if (!aiMsg.content || aiMsg.content.trim() === '') {
            aiMsg.content = '候选人思考中...'
          }
          aiMsg.streaming = false
          newMessages[newMessages.length - 1] = { ...aiMsg }
          setMessages([...newMessages])
          setIsLoading(false)
        },
        onError: () => {
          // Only show error if no content was received
          if (!aiMsg.content || aiMsg.content.trim() === '') {
            aiMsg.content = '候选人暂时无法回复，请稍后再试...'
          }
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
        <View className={`flex flex-row items-center gap-2 mb-6 ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <View onClick={() => Taro.navigateBack()} className="p-1 btn-press">
            <ArrowLeft size={20} color="#6366F1" />
          </View>
          <Text className="block text-xl font-bold text-foreground">HR反向模拟</Text>
        </View>

        <View className={`mb-4 ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
          <Text className="block text-sm text-muted-foreground mb-1">选择候选人简历</Text>
          <Text className="block text-xs text-muted-foreground" style={{ opacity: 0.6 }}>你将扮演HR面试这位候选人，考察你的选人眼光</Text>
        </View>

        {RESUME_PROFILES.map((profile, idx) => (
          <Card
            key={idx}
            className={`mb-3 shadow-card card-hover ${loaded ? `anim-fade-in-up anim-delay-${idx + 2}` : 'opacity-0'}`}
            onClick={() => startInterview(idx)}
          >
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-3">
                <View
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${profile.color}15` }}
                >
                  <User size={24} color={profile.color} />
                </View>
                <View className="flex-1">
                  <View className="flex flex-row items-center gap-2">
                    <Text className="block font-semibold text-foreground">{profile.name}</Text>
                    <Badge className="text-xs border-none" style={{ backgroundColor: `${profile.color}15`, color: profile.color }}>{profile.tag}</Badge>
                  </View>
                  <Text className="block text-xs text-muted-foreground mt-1">{profile.school}</Text>
                  <Text className="block text-xs text-muted-foreground mt-1" style={{ opacity: 0.7 }}>{profile.summary}</Text>
                </View>
                <ChevronRight size={16} color="#6B7B7480" />
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
        <View className={`flex flex-row items-center gap-2 mb-6 ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <View onClick={() => Taro.navigateBack()} className="p-1 btn-press">
            <ArrowLeft size={20} color="#6366F1" />
          </View>
          <Text className="block text-xl font-bold text-foreground">招聘笔记</Text>
        </View>

        <Card className={`shadow-card ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <View className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <FileCheck size={16} color="#10B981" />
              </View>
              <Text className="block font-semibold text-foreground">你的评估 vs 真实情况</Text>
            </View>
            <Separator className="mb-3" />
            <Text className="block text-sm text-foreground leading-relaxed whitespace-pre-wrap">{hrNotes}</Text>
          </CardContent>
        </Card>

        <View className={`mt-4 ${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}>
          <Button className="w-full btn-shimmer btn-press" onClick={() => { setStep('select'); setMessages([]); setHrNotes('') }}>
            <BookOpen size={16} color="#fff" />
            <Text>再来一轮</Text>
          </Button>
        </View>
      </View>
    )
  }

  /** 面试对话阶段 */
  return (
    <View className="flex flex-col bg-background" style={{ height: '100vh', position: 'relative' }}>
      {/* 顶部 - fixed */}
      <View
        className="px-4 pt-4 pb-3 rounded-b-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <View className="absolute -top-4 -right-4 w-20 h-20 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
        <View className="flex flex-row items-center gap-3 relative">
          <View onClick={() => Taro.navigateBack()} className="p-1 btn-press">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="block text-white font-bold text-base">HR模拟面试</Text>
            <Text className="block text-gray-300 text-xs">候选人: {RESUME_PROFILES[resumeIndex].name}</Text>
          </View>
          <Badge className="bg-accent text-white border-none text-xs badge-glow">
            <Eye size={12} color="#fff" /> 评估中
          </Badge>
        </View>
      </View>

      {/* 聊天区 - scrollable middle area */}
      <ScrollView
        className="flex-1 px-4"
        style={{ paddingTop: '90px', paddingBottom: keyboardOffset > 0 ? `${keyboardOffset + 80}px` : '160px' }}
        scrollY
        scrollIntoView={scrollRef.current}
        scrollWithAnimation
      >
        {messages.map((msg, idx) => (
          <View key={idx} id={`msg-${idx}`} className={`mb-3 ${msg.role === 'user' ? 'anim-slide-in-right' : 'anim-slide-in-left'}`}>
            {msg.role === 'assistant' ? (
              <View className="flex flex-row items-start gap-2 max-w-[85%]">
                <View className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1" style={{ overflow: 'hidden' }}>
                  <Bot size={14} color="#fff" />
                </View>
                <Card className="shadow-card">
                  <CardContent className="p-3">
                    <Text className="block text-sm text-foreground leading-relaxed">
                      {msg.content}
                      {msg.streaming && <Text className="inline-block w-2 h-4 bg-violet-500 ml-1 align-middle cursor-blink" />}
                    </Text>
                    {msg.streaming && (
                      <Text className="block text-xs mt-1" style={{ color: msg.content.length >= AI_MAX_CHARS * 0.9 ? '#EF4444' : '#9CA3AF' }}>
                        {msg.content.length}/{AI_MAX_CHARS}
                      </Text>
                    )}
                  </CardContent>
                </Card>
              </View>
            ) : (
              <View className="flex flex-row items-start gap-2 max-w-[85%] ml-auto flex-row-reverse">
                <View className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1" style={{ overflow: 'hidden' }}>
                  <Text className="text-white text-xs font-bold">HR</Text>
                </View>
                <Card className="shadow-card" style={{ background: 'linear-gradient(135deg, #5B21B6, #7C3AED)' }}>
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
              <View className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1" style={{ overflow: 'hidden' }}>
                <Bot size={14} color="#fff" />
              </View>
              <Card className="shadow-card">
                <CardContent className="p-3">
                  <View className="flex flex-row items-center gap-1">
                    <View className="w-2 h-2 bg-violet-500 rounded-full dot-typewriter" />
                    <View className="w-2 h-2 bg-violet-500 rounded-full dot-typewriter" style={{ animationDelay: '0.2s' }} />
                    <View className="w-2 h-2 bg-violet-500 rounded-full dot-typewriter" style={{ animationDelay: '0.4s' }} />
                  </View>
                </CardContent>
              </Card>
            </View>
          </View>
        )}
        <View id="msg-bottom-hr" />
      </ScrollView>

      {/* 底部输入区 - fixed, adapts to keyboard */}
      <View
        className="bg-card border-t border-outline-variant border-opacity-15"
        style={{
          position: 'fixed',
          bottom: keyboardOffset > 0 ? `${keyboardOffset}px` : 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        {/* 输入行 */}
        <View className="flex flex-row items-center gap-2 px-3 py-3">
          <View className="flex-1 bg-muted rounded-full px-4 py-2">
            <Input
              className="w-full text-sm text-foreground"
              placeholder="向候选人提问..."
              value={input}
              onInput={(e) => setInput(e.detail.value)}
              onConfirm={sendMessage}
              confirmType="send"
              disabled={isLoading}
            />
          </View>
          <View className="flex-shrink-0">
            <Button
              size="sm"
              className="bg-primary rounded-full btn-shimmer btn-press"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
            >
              <Send size={16} color="#fff" />
            </Button>
          </View>
        </View>

        {/* 结束模拟按钮 */}
        {messages.length > 1 && (
          <View className="px-4 pb-4 pt-1">
            <Button variant="outline" className="w-full btn-hover-lift btn-press" onClick={endSimulation}>
              <FileCheck size={14} color="#8B5CF6" />
              <Text>结束面试 · 查看招聘笔记</Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}
