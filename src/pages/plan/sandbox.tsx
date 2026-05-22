import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Send, Compass, Target, TrendingUp, Shield } from 'lucide-react-taro'
import { useState } from 'react'
import { Network } from '@/network'

/** 职业规划沙盘 - AI对话 + 画像 + 路径卡片 */
export default function Sandbox() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: '你好！我是你的职业导航师。告诉我你的专业、兴趣和目标，我会帮你规划最佳职业路径。' }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [pathData, setPathData] = useState<any[]>([])
  const [showResult, setShowResult] = useState(false)

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return
    const userMsg = { role: 'user' as const, content: inputText.trim() }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsLoading(true)
    try {
      const conversation = [...messages, userMsg].map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }))
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: { action: 'career_plan', conversation }
      })
      console.log('Career plan response:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        const data = res.data.data
        if (data.profile) setProfile(data.profile)
        if (data.paths) setPathData(data.paths)
        if (data.message) {
          setMessages(prev => [...prev, { role: 'ai', content: data.message }])
        }
        if (data.profile && data.paths) setShowResult(true)
      }
    } catch (err) {
      console.log('Career plan error:', err)
      setMessages(prev => [...prev, { role: 'ai', content: '抱歉，出了点问题，请再试一次。' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="h-full flex flex-col bg-background">
      {/* 顶部 */}
      <View className="bg-violet-500 px-4 py-3">
        <View className="flex flex-row items-center gap-2">
          <Compass size={20} color="#fff" />
          <Text className="block text-white font-bold text-lg">职业规划沙盘</Text>
        </View>
        <Text className="block text-purple-200 text-xs mt-1">AI导航师帮你找到最佳职业路径</Text>
      </View>

      {/* 对话区域 */}
      <View className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg, idx) => (
          <View key={idx} className={`flex flex-col mb-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'ai' ? (
              <View className="flex flex-row items-start gap-2 max-w-[85%]">
                <View className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Compass size={14} color="#fff" />
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
            <View className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
              <Compass size={14} color="#fff" />
            </View>
            <View className="bg-white rounded-2xl p-3 shadow-sm">
              <Text className="block text-sm text-gray-400">思考中...</Text>
            </View>
          </View>
        )}

        {/* 画像 + 路径结果 */}
        {showResult && profile && (
          <Card className="shadow-sm mt-4">
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-2 mb-3">
                <Shield size={16} color="#8B5CF6" />
                <Text className="block font-semibold text-foreground">你的职业画像</Text>
              </View>
              <View className="flex flex-col gap-2">
                {profile.strengths && (
                  <View>
                    <Text className="block text-xs text-gray-500">优势</Text>
                    <View className="flex flex-row flex-wrap gap-1 mt-1">
                      {(profile.strengths as string[]).map((s: string, i: number) => (
                        <Badge key={i} className="bg-emerald-50 text-emerald-600 border-none text-xs">{s}</Badge>
                      ))}
                    </View>
                  </View>
                )}
                {profile.interests && (
                  <View>
                    <Text className="block text-xs text-gray-500">兴趣</Text>
                    <View className="flex flex-row flex-wrap gap-1 mt-1">
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
              <Card key={idx} className="shadow-sm mb-3">
                <CardContent className="p-4">
                  <View className="flex flex-row items-center gap-2 mb-2">
                    <Target size={16} color="#FF6B35" />
                    <Text className="block font-semibold text-foreground">{path.name || `路径 ${idx + 1}`}</Text>
                    {path.fit_score && <Badge className="bg-accent text-white border-none text-xs">{path.fit_score}%匹配</Badge>}
                  </View>
                  <Text className="block text-sm text-gray-600 leading-relaxed">{path.description || ''}</Text>
                  {path.milestones && (
                    <View className="mt-2 flex flex-col gap-1">
                      {(path.milestones as string[]).map((m: string, mi: number) => (
                        <View key={mi} className="flex flex-row items-center gap-2">
                          <TrendingUp size={12} color="#8B5CF6" />
                          <Text className="block text-xs text-gray-500">{m}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* 输入区域 */}
      <View className="bg-white border-t border-gray-100 px-4 py-3 flex flex-row items-center gap-2">
        <View className="flex-1 bg-gray-50 rounded-full px-4 py-2">
          <Input
            style={{ width: '100%', fontSize: '14px', backgroundColor: 'transparent' }}
            placeholder="告诉我你的职业目标..."
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
            onConfirm={sendMessage}
          />
        </View>
        <Button size="sm" className="bg-violet-500 text-white border-none rounded-full" onClick={sendMessage} disabled={isLoading || !inputText.trim()}>
          <Send size={16} color="#fff" />
        </Button>
      </View>
    </View>
  )
}
