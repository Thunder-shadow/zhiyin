import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, ChevronLeft } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

interface Message {
  role: 'ai' | 'user'
  content: string
  timestamp: number
}

/** 面试房间 - 全屏沉浸式AI面试 */
export default function InterviewRoom() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [interviewId, setInterviewId] = useState('')
  const interviewType = Taro.getCurrentInstance().router?.params?.type || 'single'

  useEffect(() => {
    startInterview()
  }, [])

  const startInterview = async () => {
    setIsLoading(true)
    try {
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: { action: 'interview_start', type: interviewType }
      })
      console.log('Interview start:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        setInterviewId(res.data.data.interview_id || '')
        setMessages([{
          role: 'ai',
          content: res.data.data.message || '你好，我是今天的面试官，请先做一个简单的自我介绍吧。',
          timestamp: Date.now()
        }])
      }
    } catch (err) {
      console.log('Start interview error:', err)
      setMessages([{
        role: 'ai',
        content: '你好，我是今天的面试官，请先做一个简单的自我介绍吧。',
        timestamp: Date.now()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return
    const userMsg: Message = { role: 'user', content: inputText.trim(), timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsLoading(true)

    try {
      const conversationHistory = [...messages, userMsg].map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }))
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          action: 'interview_follow_up',
          conversation: conversationHistory,
          interview_id: interviewId,
        }
      })
      console.log('Follow up response:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: res.data.data.message || '请继续。',
          timestamp: Date.now()
        }])
      }
    } catch (err) {
      console.log('Follow up error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const endInterview = async () => {
    setIsLoading(true)
    try {
      const conversationHistory = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content }))
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: {
          action: 'interview_report',
          conversation: conversationHistory,
          interview_id: interviewId,
        }
      })
      console.log('Report response:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        const report = res.data.data
        Taro.navigateTo({ url: `/pages/interview/report?data=${encodeURIComponent(JSON.stringify(report))}` })
      }
    } catch (err) {
      console.log('End interview error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="h-full flex flex-col bg-background">
      {/* AI面试官头部 */}
      <View className="bg-primary px-4 py-3 flex flex-row items-center gap-3">
        <View onClick={() => Taro.navigateBack()}>
          <ChevronLeft size={20} color="#fff" />
        </View>
        <View className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
          <Text className="text-white text-xs font-bold">AI</Text>
        </View>
        <View>
          <Text className="block text-white font-semibold text-sm">AI面试官</Text>
          <Text className="block text-gray-300 text-xs">{interviewType === 'stress' ? '压力面试' : interviewType === 'group' ? '群面模拟' : '单面模拟'}</Text>
        </View>
      </View>

      {/* 对话流 */}
      <View className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg, idx) => (
          <View key={idx} className={`flex flex-col mb-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'ai' && (
              <View className="flex flex-row items-start gap-2 max-w-[85%]">
                <View className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                  <Text className="text-white text-xs">AI</Text>
                </View>
                <View className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm">
                  <Text className="block text-sm text-foreground leading-relaxed">{msg.content}</Text>
                </View>
              </View>
            )}
            {msg.role === 'user' && (
              <View className="max-w-[85%]">
                <View className="bg-primary rounded-2xl rounded-tr-sm p-3">
                  <Text className="block text-sm text-white leading-relaxed">{msg.content}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
        {isLoading && (
          <View className="flex flex-row items-start gap-2">
            <View className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <Text className="text-white text-xs">AI</Text>
            </View>
            <View className="bg-white rounded-2xl p-3 shadow-sm">
              <Text className="block text-sm text-gray-400">思考中...</Text>
            </View>
          </View>
        )}
      </View>

      {/* 底部操作区 */}
      <View className="bg-white border-t border-gray-100 px-4 py-3 flex flex-row items-center gap-2">
        <View className="flex-1 bg-gray-50 rounded-full px-4 py-2">
          <Input
            style={{ width: '100%', fontSize: '14px', backgroundColor: 'transparent' }}
            placeholder="输入你的回答..."
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
            onConfirm={sendMessage}
          />
        </View>
        <Button size="sm" className="bg-primary text-white border-none rounded-full" onClick={sendMessage} disabled={isLoading || !inputText.trim()}>
          <Send size={16} color="#fff" />
        </Button>
        <Button size="sm" className="bg-accent text-white border-none rounded-full" onClick={endInterview} disabled={isLoading || messages.length < 3}>
          <Text className="text-white text-xs">结束</Text>
        </Button>
      </View>
    </View>
  )
}
