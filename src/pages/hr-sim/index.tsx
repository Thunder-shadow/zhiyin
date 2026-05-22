import { View, Text, ScrollView } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Send, FileCheck, User, Bot, Eye, BookOpen } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useRef } from 'react'
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
            newMessages.push({ role: 'assistant', content: '候选人准备中，请稍后...' })
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
          aiMsg.content = '候选人思考中...'
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
        <View className="flex flex-row items-center gap-2 mb-6 anim-fade-in-up">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="#6366F1" />
          </View>
          <Text className="block text-xl font-bold text-foreground">HR反向模拟</Text>
        </View>

        <View className="mb-4 anim-fade-in-up anim-delay-1">
          <Text className="block text-sm text-gray-500 mb-1">选择候选人简历</Text>
          <Text className="block text-xs text-gray-400">你将扮演HR面试这位候选人，考察你的选人眼光</Text>
        </View>

        {RESUME_PROFILES.map((profile, idx) => (
          <Card
            key={idx}
            className={`mb-3 shadow-sm card-hover anim-fade-in-up anim-delay-${idx + 2}`}
            onClick={() => startInterview(idx)}
          >
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-3">
                <View
                  className="w-12 h-12 rounded-xl flex items-center justify-center btn-shimmer"
                  style={{ backgroundColor: `${profile.color}20` }}
                >
                  <User size={24} color={profile.color} />
                </View>
                <View className="flex-1">
                  <View className="flex flex-row items-center gap-2">
                    <Text className="block font-semibold text-foreground">{profile.name}</Text>
                    <Badge className="text-xs border-none" style={{ backgroundColor: `${profile.color}20`, color: profile.color }}>{profile.tag}</Badge>
                  </View>
                  <Text className="block text-xs text-gray-500 mt-1">{profile.school}</Text>
                  <Text className="block text-xs text-gray-400 mt-1">{profile.summary}</Text>
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
        <View className="flex flex-row items-center gap-2 mb-6 anim-fade-in-up">
          <View onClick={() => Taro.navigateBack()} className="p-1">
            <ArrowLeft size={20} color="#6366F1" />
          </View>
          <Text className="block text-xl font-bold text-foreground">招聘笔记</Text>
        </View>

        <Card className="shadow-sm anim-fade-in-up anim-delay-1">
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <FileCheck size={18} color="#10B981" />
              <Text className="block font-semibold text-foreground">你的评估 vs 真实情况</Text>
            </View>
            <Separator className="mb-3" />
            <Text className="block text-sm text-foreground leading-relaxed whitespace-pre-wrap">{hrNotes}</Text>
          </CardContent>
        </Card>

        <View className="mt-4 anim-fade-in-up anim-delay-2">
          <Button className="w-full btn-shimmer" onClick={() => { setStep('select'); setMessages([]); setHrNotes('') }}>
            <BookOpen size={16} color="#fff" />
            <Text>再来一轮</Text>
          </Button>
        </View>
      </View>
    )
  }

  /** 面试对话阶段 */
  return (
    <View className="flex flex-col h-screen bg-background">
      {/* 顶部 */}
      <View className="bg-violet-600 px-4 pt-4 pb-3 rounded-b-2xl">
        <View className="flex flex-row items-center gap-3">
          <View onClick={() => Taro.navigateBack()} className="p-1">
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

      {/* 聊天区 */}
      <ScrollView className="flex-1 px-4 pt-4 pb-2" scrollY scrollIntoView={scrollRef.current} scrollWithAnimation>
        {messages.map((msg, idx) => (
          <View key={idx} id={`msg-${idx}`} className={`mb-3 ${msg.role === 'user' ? 'anim-slide-in-right' : 'anim-slide-in-left'}`}>
            {msg.role === 'assistant' ? (
              <View className="flex flex-row items-start gap-2 max-w-[85%]">
                <View className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={14} color="#fff" />
                </View>
                <Card className="shadow-sm">
                  <CardContent className="p-3">
                    <Text className="block text-sm text-foreground leading-relaxed">
                      {msg.content}
                      {msg.streaming && <Text className="inline-block w-2 h-4 bg-violet-500 ml-1 align-middle cursor-blink" />}
                    </Text>
                  </CardContent>
                </Card>
              </View>
            ) : (
              <View className="flex flex-row items-start gap-2 max-w-[85%] ml-auto flex-row-reverse">
                <View className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                  <Text className="text-white text-xs font-bold">HR</Text>
                </View>
                <Card className="shadow-sm bg-violet-600">
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
              <View className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={14} color="#fff" />
              </View>
              <Card className="shadow-sm">
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

      {/* 输入区 */}
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
            placeholder="向候选人提问..."
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

      {/* 结束模拟按钮 */}
      {messages.length > 1 && (
        <View
          style={{
            padding: '8px 16px 16px', backgroundColor: '#fff',
            display: 'flex', justifyContent: 'center'
          }}
        >
          <Button variant="outline" className="w-full btn-hover-lift" onClick={endSimulation}>
            <FileCheck size={14} color="#8B5CF6" />
            <Text>结束面试 · 查看招聘笔记</Text>
          </Button>
        </View>
      )}
    </View>
  )
}
