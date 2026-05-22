import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, FileText, Target, ArrowLeft, Shield, Lightbulb, MessageCircle } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

/** 公司详情页 - JD + AI策略 + 投递行动 */
export default function CompanyDetail() {
  const [card, setCard] = useState<any>(null)
  const [jdText, setJdText] = useState('')
  const [strategyLoading, setStrategyLoading] = useState(false)
  const [strategy, setStrategy] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.id) {
      loadCard(params.id)
    } else {
      setTimeout(() => setLoaded(true), 80)
    }
  }, [])

  const loadCard = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/job-cards/${id}` })
      console.log('Card detail:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        setCard(res.data.data)
        setJdText(res.data.data.jd_text || '')
        if (res.data.data.resume_tips) {
          setStrategy(res.data.data)
        }
      }
    } catch (err) {
      console.log('Load card error:', err)
    } finally {
      setTimeout(() => setLoaded(true), 80)
    }
  }

  const generateStrategy = async () => {
    if (!card || !jdText) return
    setStrategyLoading(true)
    try {
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: { action: 'jd_reverse_parse', jd_text: jdText, job_card_id: card.id }
      })
      console.log('Strategy response:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        setStrategy(res.data.data)
      }
    } catch (err) {
      console.log('Strategy error:', err)
    } finally {
      setStrategyLoading(false)
    }
  }

  return (
    <View className="min-h-full bg-background">
      {/* 顶部 */}
      {card && (
        <View className={`bg-gradient-to-br from-blue-500 to-blue-700 px-4 pt-4 pb-6 rounded-b-3xl ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <View className="flex flex-row items-center gap-3 mb-2">
            <View onClick={() => Taro.navigateBack()} className="p-1">
              <ArrowLeft size={20} color="#fff" />
            </View>
            <View className="w-12 h-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
              <Text className="text-white font-bold text-lg">{(card.company || '?')[0]}</Text>
            </View>
            <View className="flex-1">
              <Text className="block font-bold text-white text-lg">{card.company}</Text>
              <Text className="block text-blue-200 text-sm">{card.position}</Text>
            </View>
            <Badge className="bg-accent text-white border-none badge-glow">
              {card.status === 'interested' ? '攻略中' : card.status}
            </Badge>
          </View>
        </View>
      )}

      <View className="px-4 -mt-3">
        {/* JD 输入/展示区 */}
        <Card className={`mb-4 shadow-sm ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <FileText size={16} color="#3B82F6" />
              <Text className="block font-semibold text-foreground">职位描述 (JD)</Text>
            </View>
            <View className="bg-gray-50 rounded-xl p-3">
              <Textarea
                style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent', fontSize: '13px' }}
                placeholder="粘贴岗位JD，AI将逆向解析隐性需求..."
                value={jdText}
                onInput={(e) => setJdText(e.detail.value)}
              />
            </View>
            <Button
              className="w-full mt-3 btn-shimmer"
              disabled={strategyLoading || !jdText}
              onClick={generateStrategy}
            >
              <Sparkles size={16} color="#fff" />
              <Text className="text-white ml-1">{strategyLoading ? 'AI解析中...' : 'AI逆向解析JD'}</Text>
            </Button>
          </CardContent>
        </Card>

        {/* AI 策略结果 */}
        {strategy && (
          <Card className="mb-4 shadow-sm anim-fade-in-up">
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-2 mb-3">
                <Target size={16} color="#FF6B35" />
                <Text className="block font-semibold text-foreground">AI攻略策略</Text>
              </View>
              {strategy.resume_tips && (
                <View className="mb-3">
                  <View className="flex flex-row items-center gap-1 mb-1">
                    <Shield size={12} color="#3B82F6" />
                    <Text className="block text-xs text-gray-400">简历修饰建议</Text>
                  </View>
                  <Text className="block text-sm text-foreground leading-relaxed">{strategy.resume_tips}</Text>
                </View>
              )}
              {strategy.hidden_requirements && (
                <View className="mb-3">
                  <View className="flex flex-row items-center gap-1 mb-1">
                    <Lightbulb size={12} color="#F59E0B" />
                    <Text className="block text-xs text-gray-400">隐性需求</Text>
                  </View>
                  <Text className="block text-sm text-foreground leading-relaxed">{strategy.hidden_requirements}</Text>
                </View>
              )}
              {strategy.hr_questions_prediction?.length > 0 && (
                <View>
                  <View className="flex flex-row items-center gap-1 mb-1">
                    <MessageCircle size={12} color="#8B5CF6" />
                    <Text className="block text-xs text-gray-400">HR可能的问题</Text>
                  </View>
                  {strategy.hr_questions_prediction.map((q: string, i: number) => (
                    <View key={i} className="flex flex-row items-start gap-2 mb-1">
                      <Text className="text-xs text-accent">{i + 1}.</Text>
                      <Text className="text-sm text-foreground">{q}</Text>
                    </View>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        )}
      </View>
    </View>
  )
}
