import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Send, Eye, ChevronLeft, Star } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'

/** HR反向模拟 - 用户扮演HR面试候选人 */
export default function HrSim() {
  const [phase, setPhase] = useState<'select' | 'interview' | 'result'>('select')
  const [selectedIdx, setSelectedIdx] = useState<number>(-1)
  const [messages, setMessages] = useState<{ role: 'hr' | 'candidate'; content: string }[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [simResult, setSimResult] = useState<any>(null)

  // 3份虚拟简历
  const fakeResumes = [
    {
      name: '张明',
      school: '北京大学 · 计算机',
      highlight: '3段大厂实习，GPA 3.8',
      badge: '简历A',
      badgeColor: '#3B82F6',
    },
    {
      name: '李华',
      school: '中山大学 · 市场营销',
      highlight: '1段创业经历，社团主席',
      badge: '简历B',
      badgeColor: '#10B981',
    },
    {
      name: '王芳',
      school: '复旦 · 金融学',
      highlight: '2段投行实习，英语专八',
      badge: '简历C',
      badgeColor: '#8B5CF6',
    },
  ]

  const startInterview = async (idx: number) => {
    setSelectedIdx(idx)
    setPhase('interview')
    setIsLoading(true)
    try {
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: { action: 'hr_sim_response', resume_index: idx }
      })
      console.log('HR sim start:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        setMessages([{ role: 'candidate', content: res.data.data.message || '你好，很高兴参加这次面试。' }])
      }
    } catch (err) {
      console.log('HR sim error:', err)
      setMessages([{ role: 'candidate', content: '你好，很高兴参加这次面试。' }])
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return
    const hrMsg = { role: 'hr' as const, content: inputText.trim() }
    setMessages(prev => [...prev, hrMsg])
    setInputText('')
    setIsLoading(true)
    try {
      const conversationHistory = [...messages, hrMsg].map(m => ({
        role: m.role === 'candidate' ? 'assistant' : 'user',
        content: m.content
      }))
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: { action: 'hr_sim_response', conversation: conversationHistory, resume_index: selectedIdx }
      })
      if (res.data?.code === 0 && res.data?.data) {
        setMessages(prev => [...prev, { role: 'candidate', content: res.data.data.message }])
      }
    } catch (err) {
      console.log('HR sim send error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const endSim = async () => {
    setIsLoading(true)
    try {
      const conversationHistory = messages.map(m => ({
        role: m.role === 'candidate' ? 'assistant' : 'user',
        content: m.content
      }))
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: { action: 'hr_sim_response', conversation: conversationHistory, resume_index: selectedIdx, end: true }
      })
      if (res.data?.code === 0 && res.data?.data) {
        setSimResult(res.data.data)
      }
    } catch (err) {
      console.log('End sim error:', err)
    } finally {
      setIsLoading(false)
    }
    setPhase('result')
  }

  // 选择简历阶段
  if (phase === 'select') {
    return (
      <View className="min-h-full bg-background px-4 pt-4">
        <View className="flex flex-row items-center gap-2 mb-4" onClick={() => Taro.navigateBack()}>
          <ChevronLeft size={20} color="#1A2B4C" />
          <Text className="block font-bold text-lg text-foreground">HR反向模拟</Text>
        </View>
        <Text className="block text-sm text-gray-500 mb-4">选择一份简历开始面试。你能看出哪位候选人最优秀吗？</Text>
        <View className="flex flex-col gap-3 pb-4">
          {fakeResumes.map((r, idx) => (
            <Card key={idx} className="shadow-sm" onClick={() => startInterview(idx)}>
              <CardContent className="p-4">
                <View className="flex flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${r.badgeColor}20` }}>
                    <Text style={{ color: r.badgeColor }} className="font-bold text-sm">{r.name[0]}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex flex-row items-center gap-2">
                      <Text className="block font-semibold text-foreground">{r.name}</Text>
                      <Badge style={{ backgroundColor: `${r.badgeColor}15`, color: r.badgeColor }} className="border-none text-xs">{r.badge}</Badge>
                    </View>
                    <Text className="block text-gray-500 text-xs mt-1">{r.school}</Text>
                    <Text className="block text-gray-400 text-xs mt-1">{r.highlight}</Text>
                  </View>
                  <Eye size={16} color="#D1D5DB" />
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      </View>
    )
  }

  // 面试阶段
  if (phase === 'interview') {
    return (
      <View className="h-full flex flex-col bg-background">
        <View className="bg-primary px-4 py-3 flex flex-row items-center gap-3">
          <View onClick={() => setPhase('select')}>
            <ChevronLeft size={20} color="#fff" />
          </View>
          <View className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <Text className="text-white text-xs font-bold">候</Text>
          </View>
          <View>
            <Text className="block text-white font-semibold text-sm">{fakeResumes[selectedIdx].name} (候选人)</Text>
            <Text className="block text-gray-300 text-xs">你正在扮演HR</Text>
          </View>
        </View>
        <View className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((msg, idx) => (
            <View key={idx} className={`flex flex-col mb-4 ${msg.role === 'hr' ? 'items-end' : 'items-start'}`}>
              {msg.role === 'candidate' ? (
                <View className="flex flex-row items-start gap-2 max-w-[85%]">
                  <View className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Text className="text-white text-xs">{fakeResumes[selectedIdx].name[0]}</Text>
                  </View>
                  <View className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm">
                    <Text className="block text-sm text-foreground leading-relaxed">{msg.content}</Text>
                  </View>
                </View>
              ) : (
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
              <View className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Text className="text-white text-xs">{fakeResumes[selectedIdx].name[0]}</Text>
              </View>
              <View className="bg-white rounded-2xl p-3 shadow-sm">
                <Text className="block text-sm text-gray-400">思考中...</Text>
              </View>
            </View>
          )}
        </View>
        <View className="bg-white border-t border-gray-100 px-4 py-3 flex flex-row items-center gap-2">
          <View className="flex-1 bg-gray-50 rounded-full px-4 py-2">
            <Input
              style={{ width: '100%', fontSize: '14px', backgroundColor: 'transparent' }}
              placeholder="以HR身份提问..."
              value={inputText}
              onInput={(e) => setInputText(e.detail.value)}
              onConfirm={sendMessage}
            />
          </View>
          <Button size="sm" className="bg-primary text-white border-none rounded-full" onClick={sendMessage} disabled={isLoading || !inputText.trim()}>
            <Send size={16} color="#fff" />
          </Button>
          <Button size="sm" className="bg-accent text-white border-none rounded-full" onClick={endSim} disabled={isLoading || messages.length < 3}>
            <Text className="text-white text-xs">结束</Text>
          </Button>
        </View>
      </View>
    )
  }

  // 结果阶段
  return (
    <View className="min-h-full bg-background px-4 pt-4 pb-8">
      <View className="flex flex-row items-center gap-2 mb-4" onClick={() => { setPhase('select'); setMessages([]); }}>
        <ChevronLeft size={20} color="#1A2B4C" />
        <Text className="block font-bold text-lg text-foreground">揭晓结果</Text>
      </View>
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <Star size={20} color="#FF6B35" />
            <Text className="block font-bold text-foreground">HR招聘笔记</Text>
          </View>
          <Text className="block text-sm text-foreground leading-relaxed">
            {simResult?.hr_notes || '面试分析生成中...'}
          </Text>
        </CardContent>
      </Card>
      <Button className="w-full mt-4 bg-primary text-white border-none rounded-lg" onClick={() => { setPhase('select'); setMessages([]); setSimResult(null); }}>
        <Text className="text-white">再试一次</Text>
      </Button>
    </View>
  )
}
