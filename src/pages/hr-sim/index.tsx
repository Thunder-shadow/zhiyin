import { View, Text, ScrollView } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Send, FileCheck, User, Bot, Eye, ChevronRight, Clock, Plus } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useRef, useEffect } from 'react'
import { Network } from '@/network'
import { fetchStream } from '@/utils/stream'
import { useKeyboardOffset } from '@/lib/hooks/use-keyboard-offset'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface HrCandidate {
  id: string
  name: string
  school: string
  major: string
  background: string
  personality: string
  real_level: string
  summary?: string
  tag?: string
  color?: string
}

export default function HrSim() {
  const [step, setStep] = useState<'select' | 'interview'>('select')
  const [candidates, setCandidates] = useState<HrCandidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<HrCandidate | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const scrollRef = useRef('')
  const keyboardOffset = useKeyboardOffset()

  useEffect(() => {
    setTimeout(() => setLoaded(true), 80)
    loadCandidates()
  }, [])

  const scrollToBottom = () => {
    scrollRef.current = 'msg-bottom-hr-' + Date.now()
    // Backup: use Taro.pageScrollTo in case scrollIntoView doesn't work
    setTimeout(() => {
      Taro.pageScrollTo({ scrollTop: 99999, duration: 100 }).catch(() => {})
    }, 50)
  }

  /** 键盘弹起时自动滚动到底部 */
  useEffect(() => {
    if (keyboardOffset > 0) {
      // Longer delay to ensure keyboard is fully shown
      setTimeout(() => scrollToBottom(), 300)
    }
  }, [keyboardOffset])

  const loadCandidates = async () => {
    try {
      const res = await Network.request({ url: '/api/hr-candidates' })
      if (res.data?.code === 0) {
        setCandidates(res.data.data || [])
      }
    } catch (err) {
      console.error('Load candidates error:', err)
    } finally {
      setCandidatesLoading(false)
    }
  }

  /** 开始面试 */
  const startInterview = async (candidate: HrCandidate) => {
    setSelectedCandidate(candidate)
    setStep('interview')
    setMessages([])
    setIsLoading(true)

    const newMessages: ChatMessage[] = []

    await fetchStream(
      '/api/ai/chat/stream',
      {
        action: 'hr_sim_response',
        candidate: {
          name: candidate.name,
          school: candidate.school,
          major: candidate.major,
          background: candidate.background,
          personality: candidate.personality,
          real_level: candidate.real_level,
        },
        conversation: [],
      },
      {
        onChunk: (content) => {
          if (newMessages.length === 0) {
            newMessages.push({ role: 'assistant', content: '', streaming: true })
          }
          const msg = newMessages[0]
          msg.content += content
          newMessages[0] = { ...msg }
          setMessages([...newMessages])
          scrollToBottom()
        },
        onDone: () => {
          if (newMessages.length > 0) {
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
    if (!trimmed || isLoading || !selectedCandidate) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const currentConversation = [...messages, userMsg]
    setMessages(currentConversation)
    setInput('')
    setIsLoading(true)

    const aiMsg: ChatMessage = { role: 'assistant', content: '', streaming: true }
    const newMessages = [...currentConversation, aiMsg]
    setMessages([...newMessages])
    // Scroll to bottom after adding user message
    setTimeout(() => scrollToBottom(), 100)

    await fetchStream(
      '/api/ai/chat/stream',
      {
        action: 'hr_sim_response',
        candidate: {
          name: selectedCandidate.name,
          school: selectedCandidate.school,
          major: selectedCandidate.major,
          background: selectedCandidate.background,
          personality: selectedCandidate.personality,
          real_level: selectedCandidate.real_level,
        },
        conversation: currentConversation.map(m => ({ role: m.role, content: m.content })),
      },
      {
        onChunk: (content) => {
          aiMsg.content += content
          newMessages[newMessages.length - 1] = { ...aiMsg }
          setMessages([...newMessages])
          scrollToBottom()
        },
        onDone: () => {
          if (!aiMsg.content || aiMsg.content.trim() === '') {
            aiMsg.content = '候选人思考中...'
          }
          aiMsg.streaming = false
          newMessages[newMessages.length - 1] = { ...aiMsg }
          setMessages([...newMessages])
          setIsLoading(false)
        },
        onError: () => {
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

  /** 结束模拟 - 跳转到报告生成页面 */
  const endSimulation = () => {
    if (!selectedCandidate) return
    Taro.setStorageSync('hr_sim_conversation', messages)
    Taro.navigateTo({
      url: `/pages/hr-sim/report?candidateName=${encodeURIComponent(selectedCandidate.name)}&candidateId=${selectedCandidate.id}`
    })
  }

  /** 选择简历阶段 */
  if (step === 'select') {
    return (
      <View className="min-h-full bg-background">
        {/* 顶部 */}
        <View
          className="px-4 pt-4 pb-3 rounded-b-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)',
          }}
        >
          <View className="absolute -top-4 -right-4 w-20 h-20 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
          <View className="flex flex-row items-center gap-3 relative">
            <View onClick={() => Taro.navigateBack()} className="p-1 btn-press">
              <ArrowLeft size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="block text-white font-bold text-base">HR反向模拟</Text>
              <Text className="block text-gray-300 text-xs">选择候选人开始面试</Text>
            </View>
            <Button
              size="sm"
              className="bg-white bg-opacity-20 border-none rounded-lg btn-press"
              onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/candidates' })}
            >
              <Text className="text-white text-xs">管理</Text>
            </Button>
          </View>
        </View>

        <View className="px-4 pt-4 pb-6">
          <View className={`mb-4 ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
            <Text className="block text-sm text-muted-foreground mb-1">选择候选人简历</Text>
            <Text className="block text-xs text-muted-foreground" style={{ opacity: 0.6 }}>你将扮演HR面试这位候选人，考察你的选人眼光</Text>
          </View>

          {candidatesLoading ? (
            <View className="flex flex-col items-center py-16">
              <Text className="block text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : candidates.length === 0 ? (
            <View className={`${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}>
              <Card className="shadow-card">
                <CardContent className="p-8 flex flex-col items-center">
                  <View
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{ background: 'linear-gradient(135deg, #EDE9FE, #E0E7FF)' }}
                  >
                    <User size={36} color="#C4B5FD" />
                  </View>
                  <Text className="block text-base font-semibold text-foreground mb-2">还没有候选人</Text>
                  <Text className="block text-sm text-muted-foreground text-center leading-relaxed mb-5">
                    先创建候选人，再开始面试
                  </Text>
                  <Button
                    className="btn-shimmer btn-press"
                    onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/candidate-edit' })}
                  >
                    <Plus size={16} color="#fff" />
                    <Text className="ml-1">创建候选人</Text>
                  </Button>
                </CardContent>
              </Card>
            </View>
          ) : (
            <View>
              {candidates.map((candidate, idx) => (
                <Card
                  key={candidate.id}
                  className={`mb-3 shadow-card card-hover ${loaded ? `anim-fade-in-up anim-delay-${Math.min(idx + 2, 5)}` : 'opacity-0'}`}
                  onClick={() => startInterview(candidate)}
                >
                  <CardContent className="p-4">
                    <View className="flex flex-row items-center gap-3">
                      <View
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${candidate.color || '#8B5CF6'}15` }}
                      >
                        <User size={24} color={candidate.color || '#8B5CF6'} />
                      </View>
                      <View className="flex-1">
                        <View className="flex flex-row items-center gap-2">
                          <Text className="block font-semibold text-foreground">{candidate.name}</Text>
                          {candidate.tag && (
                            <Badge className="text-xs border-none" style={{
                              backgroundColor: `${candidate.color || '#8B5CF6'}15`,
                              color: candidate.color || '#8B5CF6'
                            }}>
                              {candidate.tag}
                            </Badge>
                          )}
                        </View>
                        <Text className="block text-xs text-muted-foreground mt-1">{candidate.school} · {candidate.major}</Text>
                        {candidate.summary && (
                          <Text className="block text-xs text-muted-foreground mt-1" style={{ opacity: 0.7 }}>{candidate.summary}</Text>
                        )}
                      </View>
                      <ChevronRight size={16} color="#6B7B7480" />
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}

          {/* 候选人管理 + 历史报告入口 */}
          <View className={`mt-4 flex flex-col gap-3 ${loaded ? 'anim-fade-in-up anim-delay-5' : 'opacity-0'}`}>
            <Card className="shadow-card card-hover" onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/candidates' })}>
              <CardContent className="p-3">
                <View className="flex flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Plus size={20} color="#7C3AED" />
                  </View>
                  <View className="flex-1">
                    <Text className="block text-sm font-semibold text-foreground">候选人管理</Text>
                    <Text className="block text-xs text-muted-foreground">创建、编辑候选人信息</Text>
                  </View>
                  <ChevronRight size={16} color="#6B7B7480" />
                </View>
              </CardContent>
            </Card>

            <Card className="shadow-card card-hover" onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/history' })}>
              <CardContent className="p-3">
                <View className="flex flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Clock size={20} color="#7C3AED" />
                  </View>
                  <View className="flex-1">
                    <Text className="block text-sm font-semibold text-foreground">历史招聘笔记</Text>
                    <Text className="block text-xs text-muted-foreground">查看往期面试评估报告</Text>
                  </View>
                  <ChevronRight size={16} color="#6B7B7480" />
                </View>
              </CardContent>
            </Card>
          </View>
        </View>
      </View>
    )
  }

  /** 面试对话阶段 */
  const candidateName = selectedCandidate?.name || '候选人'

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
            <Text className="block text-gray-300 text-xs">候选人: {candidateName}</Text>
          </View>
          <Badge className="bg-accent text-white border-none text-xs badge-glow">
            <Eye size={12} color="#fff" /> 评估中
          </Badge>
        </View>
      </View>

      {/* 聊天区 - scrollable middle area */}
      <ScrollView
        className="flex-1 px-4"
        style={{ paddingTop: '90px', paddingBottom: keyboardOffset > 0 ? `${keyboardOffset + 100}px` : '160px' }}
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
                      <Text className="block text-xs mt-1" style={{ color: '#9CA3AF' }}>
                        {msg.content.length}字
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
