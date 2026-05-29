// eslint-disable-next-line no-restricted-syntax
import { View, Text, ScrollView, Input as TaroInput } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Bot, User, Trophy, Star, ArrowLeft, Building } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Network } from '@/network'
import { fetchStream } from '@/utils/stream'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface InterviewResult {
  decision: 'offer' | 'rejected'
  scores: {
    professional: number
    communication: number
    logic: number
    match: number
    overall: number
  }
  rounds: number
  summary: string
}

const MAX_ROUNDS = 30

function getStatusBarHeight(): number {
  try {
    return Taro.getSystemInfoSync().statusBarHeight || 0
  } catch { return 0 }
}

function parseDecision(content: string): { decision: 'offer' | 'rejected' | null; scores: InterviewResult['scores'] | null; summary: string } {
  const passMatch = content.match(/\[OFFER_DECISION:PASS\]/)
  const failMatch = content.match(/\[OFFER_DECISION:FAIL\]/)

  let decision: 'offer' | 'rejected' | null = null
  if (passMatch) decision = 'offer'
  else if (failMatch) decision = 'rejected'

  let scores: InterviewResult['scores'] | null = null
  let summary = ''

  const evalMatch = content.match(/\[EVALUATION\]([\s\S]*?)\[\/EVALUATION\]/)
  if (evalMatch) {
    const evalContent = evalMatch[1]
    scores = {
      professional: parseInt(evalContent.match(/专业能力[：:]\s*(\d+)/)?.[1] || '0'),
      communication: parseInt(evalContent.match(/沟通表达[：:]\s*(\d+)/)?.[1] || '0'),
      logic: parseInt(evalContent.match(/逻辑思维[：:]\s*(\d+)/)?.[1] || '0'),
      match: parseInt(evalContent.match(/岗位匹配[：:]\s*(\d+)/)?.[1] || '0'),
      overall: parseInt(evalContent.match(/综合评分[：:]\s*(\d+)/)?.[1] || '0'),
    }
    // Extract summary: text after [/EVALUATION] or before [EVALUATION]
    const afterEval = content.split('[/EVALUATION]')[1]
    if (afterEval) summary = afterEval.trim()
    if (!summary) {
      const beforeEval = content.split('[EVALUATION]')[0]
      if (beforeEval) summary = beforeEval.replace(/\[OFFER_DECISION:\w+\]/, '').trim()
    }
  }

  return { decision, scores, summary }
}

function ResultScreen({ result, jobInfo, onBack }: { result: InterviewResult; jobInfo: any; onBack: () => void }) {
  const isOffer = result.decision === 'offer'

  return (
    <View className='min-h-full bg-background'>
      <View className='px-4 pt-3'>
        <Card className='shadow-card overflow-hidden anim-fade-in-up'>
          <View className='h-2' style={{ background: isOffer ? 'linear-gradient(90deg, #10B981, #059669, #047857)' : 'linear-gradient(90deg, #EF4444, #DC2626, #B91C1C)' }} />
          <CardContent className='p-6 flex flex-col items-center'>
            <Text className='text-4xl mb-4'>{isOffer ? '🎉' : '😢'}</Text>
            <Text className='text-xl font-bold text-foreground mb-2'>
              {isOffer ? '恭喜通过！' : '很遗憾'}
            </Text>
            <Text className='text-sm text-muted-foreground mb-6 text-center'>
              {isOffer
                ? `你拿到了${jobInfo?.company || '该公司'}的Offer！`
                : '这次没能通过面试，继续加油！'}
            </Text>

            {/* 评分卡片 */}
            {result.scores && (
              <Card className='w-full shadow-card mb-4'>
                <CardContent className='p-4'>
                  <View className='flex flex-row items-center gap-2 mb-4'>
                    <Trophy size={18} color='#FF6B35' />
                    <Text className='font-semibold text-foreground'>面试评估报告</Text>
                  </View>
                  {[
                    { label: '专业能力', value: result.scores.professional, color: '#3B82F6' },
                    { label: '沟通表达', value: result.scores.communication, color: '#10B981' },
                    { label: '逻辑思维', value: result.scores.logic, color: '#F59E0B' },
                    { label: '岗位匹配', value: result.scores.match, color: '#8B5CF6' },
                  ].map(item => (
                    <View key={item.label} className='mb-3'>
                      <View className='flex flex-row items-center justify-between mb-1'>
                        <Text className='text-sm text-foreground'>{item.label}</Text>
                        <Text className='text-sm font-mono' style={{ color: item.color }}>{item.value}/10</Text>
                      </View>
                      <View className='w-full h-2 bg-muted rounded-full overflow-hidden'>
                        <View
                          className='h-full rounded-full progress-animated'
                          style={{ width: `${item.value * 10}%`, backgroundColor: item.color }}
                        />
                      </View>
                    </View>
                  ))}

                  {/* 综合评分 */}
                  <View className='mt-4 pt-3 border-t' style={{ borderColor: 'var(--color-outline-variant)' }}>
                    <View className='flex flex-row items-center justify-between'>
                      <Text className='text-sm font-semibold text-foreground'>综合评分</Text>
                      <Text className='text-lg font-bold' style={{ color: isOffer ? '#10B981' : '#EF4444' }}>
                        {result.scores.overall}/10
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* 面试信息 */}
            <View className='w-full flex flex-row items-center justify-center gap-4 mb-4'>
              <View className='flex flex-row items-center gap-1'>
                <Star size={14} color='#6B7B74' />
                <Text className='text-xs text-muted-foreground'>面试轮次: {result.rounds}轮</Text>
              </View>
              <View className='flex flex-row items-center gap-1'>
                <Building size={14} color='#6B7B74' />
                <Text className='text-xs text-muted-foreground'>{jobInfo?.company}</Text>
              </View>
            </View>

            {/* 评语 */}
            {result.summary && (
              <Card className='w-full shadow-card mb-4'>
                <CardContent className='p-4'>
                  <Text className='block text-sm font-semibold text-foreground mb-2'>💬 面试官评语</Text>
                  <Text className='block text-sm text-muted-foreground leading-relaxed'>{result.summary}</Text>
                </CardContent>
              </Card>
            )}

            <Button className='w-full btn-shimmer btn-press' onClick={onBack}>
              <ArrowLeft size={16} color='#fff' />
              <Text className='ml-2 text-white'>返回副本大厅</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default function DungeonInterviewRoom() {
  const router = Taro.getCurrentInstance().router
  const jobId = router?.params?.jobId || ''
  const statusBarHeight = getStatusBarHeight()

  const [jobInfo, setJobInfo] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [roundCount, setRoundCount] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null)
  const scrollRef = useRef('')

  const scrollToBottom = useCallback(() => {
    scrollRef.current = Date.now().toString()
    setTimeout(() => {
      Taro.pageScrollTo({ scrollTop: 99999, duration: 100 }).catch(() => {})
    }, 50)
  }, [])

  useEffect(() => {
    if (jobId) loadJobInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadJobInfo = async () => {
    try {
      const res = await Network.request({ url: `/api/jobs/${jobId}` })
      if (res.data?.code === 0) {
        setJobInfo(res.data.data)
      }
    } catch (err) {
      console.error('Load job error:', err)
    }
  }

  /** 更新任务状态 */
  const updateJobStatus = async (status: string, result: InterviewResult) => {
    try {
      await Network.request({
        url: `/api/jobs/${jobId}`,
        method: 'PUT',
        data: {
          status,
          interview_rounds: result.rounds,
          interview_scores: result.scores,
          interview_summary: result.summary,
        },
      })
    } catch (err) {
      console.error('Update job status error:', err)
    }
  }

  /** 开始面试 */
  const startInterview = async () => {
    if (!jobInfo) return
    setIsLoading(true)

    const newMessages: ChatMessage[] = []

    await fetchStream(
      '/api/ai/chat/stream',
      {
        action: 'interview_dungeon',
        company: jobInfo.company,
        position: jobInfo.position,
        description: jobInfo.description || '',
        round: 0,
        max_rounds: MAX_ROUNDS,
        conversation: [],
      },
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
          if (newMessages.length > 0) {
            newMessages[0].streaming = false
            // Check for decision in the first message (unlikely but handle it)
            const parsed = parseDecision(newMessages[0].content)
            if (parsed.decision) {
              handleDecision(parsed)
            }
          }
          setMessages([...newMessages])
          setRoundCount(1)
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

  /** 处理面试结果 */
  const handleDecision = async (parsed: { decision: 'offer' | 'rejected' | null; scores: InterviewResult['scores'] | null; summary: string }) => {
    if (!parsed.decision) return

    const result: InterviewResult = {
      decision: parsed.decision,
      scores: parsed.scores || { professional: 0, communication: 0, logic: 0, match: 0, overall: 0 },
      rounds: roundCount,
      summary: parsed.summary || '',
    }

    setInterviewResult(result)
    setShowResult(true)
    await updateJobStatus(parsed.decision, result)
  }

  /** 发送消息 */
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading || !jobInfo) return

    // Check if already at max rounds
    if (roundCount >= MAX_ROUNDS) {
      Taro.showToast({ title: '面试已结束', icon: 'none' })
      return
    }

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const currentConversation = [...messages, userMsg]
    setInput('')
    setIsLoading(true)
    setMessages(currentConversation)

    const newRound = roundCount + 1
    const aiMsg: ChatMessage = { role: 'assistant', content: '', streaming: true }

    // If reaching max rounds, instruct AI to give final decision
    const forceDecision = newRound >= MAX_ROUNDS

    await fetchStream(
      '/api/ai/chat/stream',
      {
        action: 'interview_dungeon',
        company: jobInfo.company,
        position: jobInfo.position,
        description: jobInfo.description || '',
        round: newRound,
        max_rounds: MAX_ROUNDS,
        force_decision: forceDecision,
        conversation: currentConversation.map(m => ({ role: m.role, content: m.content })),
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
          setRoundCount(newRound)

          // Parse for decision
          const parsed = parseDecision(aiMsg.content)
          if (parsed.decision) {
            handleDecision(parsed)
          }

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

  // Show result screen
  if (showResult && interviewResult && jobInfo) {
    return (
      <ResultScreen
        result={interviewResult}
        jobInfo={jobInfo}
        onBack={() => Taro.navigateBack()}
      />
    )
  }

  return (
    <View style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* 顶部 */}
      <View
        className='flex-shrink-0'
        style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '12px', paddingTop: `${statusBarHeight + 8}px`, background: 'linear-gradient(135deg, #E26A5C 0%, #FF6B35 50%, #D4A574 100%)' }}
      >
        <View className='flex flex-row items-center gap-3'>
          <View className='flex-1 min-w-0'>
            <Text className='block text-white font-bold text-base'>
              {jobInfo?.company || '副本面试'} · {jobInfo?.position || ''}
            </Text>
            <Text className='block text-sm' style={{ color: 'rgba(255,255,255,0.7)' }}>
              {roundCount > 0 ? `第 ${roundCount} 轮 / ${MAX_ROUNDS} 轮` : '准备开始面试'}
            </Text>
          </View>
          {roundCount > 0 && (
            <View className='px-3 py-1 rounded-full' style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Text className='text-white text-xs font-semibold'>{roundCount}/{MAX_ROUNDS}</Text>
            </View>
          )}
        </View>
        {/* 进度条 */}
        {roundCount > 0 && (
          <View className='mt-2 h-1 rounded-full overflow-hidden' style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <View
              className='h-full rounded-full transition-all'
              style={{
                width: `${(roundCount / MAX_ROUNDS) * 100}%`,
                backgroundColor: roundCount >= MAX_ROUNDS * 0.8 ? '#FCD34D' : '#fff',
              }}
            />
          </View>
        )}
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
                <View className='w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center' style={{ backgroundColor: '#E26A5C15', overflow: 'hidden' }}>
                  <Bot size={32} color='#E26A5C' />
                </View>
                <Text className='block text-lg font-bold text-foreground mb-2'>
                  {jobInfo?.company || '副本'} 面试
                </Text>
                <Text className='block text-sm text-muted-foreground mb-1'>
                  AI将扮演 {jobInfo?.company} 的 {jobInfo?.position} 面试官
                </Text>
                <Text className='block text-xs text-muted-foreground mb-4' style={{ opacity: 0.6 }}>
                  面试最多进行{MAX_ROUNDS}轮，AI会在合适时机给出Offer判断
                </Text>
                <Button
                  className='w-full'
                  style={{ backgroundColor: '#E26A5C' }}
                  onClick={startInterview}
                  disabled={!jobInfo}
                >
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
                  style={{ backgroundColor: '#E26A5C', overflow: 'hidden' }}
                >
                  <Bot size={14} color='#fff' />
                </View>
                <Card className='shadow-card'>
                  <CardContent className='p-3'>
                    <Text className='block text-sm text-foreground leading-relaxed'>
                      {msg.content}
                      {msg.streaming && <Text className='inline-block w-2 h-4 ml-1' style={{ backgroundColor: '#E26A5C', animation: 'blink 1s step-end infinite' }} />}
                    </Text>
                  </CardContent>
                </Card>
              </View>
            ) : (
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                <Card className='shadow-card' style={{ backgroundColor: '#E26A5C', maxWidth: '75%' }}>
                  <CardContent className='p-3'>
                    <Text className='block text-sm text-white leading-relaxed'>{msg.content}</Text>
                  </CardContent>
                </Card>
                <View
                  className='w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0'
                  style={{ backgroundColor: '#3A4A44', overflow: 'hidden' }}
                >
                  <User size={14} color='#fff' />
                </View>
              </View>
            )}
          </View>
        ))}

        {showThinking && (
          <View className='mb-3' id='msg-thinking'>
            <View className='flex flex-row items-start gap-2' style={{ maxWidth: '85%' }}>
              <View className='w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0' style={{ backgroundColor: '#E26A5C', overflow: 'hidden' }}>
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
        <View id='msg-bottom-dungeon' style={{ height: '1px' }} />
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
              placeholder={roundCount >= MAX_ROUNDS ? '面试已结束' : '输入你的回答...'}
              placeholderStyle='color: var(--color-muted-foreground)'
              value={input}
              onInput={(e) => setInput(e.detail.value)}
              onConfirm={sendMessage}
              confirmType='send'
              disabled={isLoading || roundCount >= MAX_ROUNDS}
              adjustPosition
              onFocus={scrollToBottom}
            />
          </View>
          <View style={{ flexShrink: 0 }}>
            <Button
              size='sm'
              className='rounded-full'
              style={{ backgroundColor: '#E26A5C' }}
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || roundCount >= MAX_ROUNDS}
            >
              <Send size={16} color='#fff' />
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
