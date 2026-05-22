import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Sparkles, FileText, Shield, Lightbulb, MessageCircle, Target } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

/** 领任务 / 岗位详情页 - JD + AI策略 + 投递行动 */
export default function CompanyDetail() {
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [industry, setIndustry] = useState('')
  const [salary, setSalary] = useState('')
  const [location, setLocation] = useState('')
  const [education, setEducation] = useState('')
  const [jdText, setJdText] = useState('')
  const [saving, setSaving] = useState(false)
  const [strategyLoading, setStrategyLoading] = useState(false)
  const [strategy, setStrategy] = useState<any>(null)
  const [cardId, setCardId] = useState('')

  // 从路由参数加载已有卡片
  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.id) {
      loadCard(params.id)
    }
  }, [])

  const loadCard = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/jobs/${id}` })
      console.log('Card detail response:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        const data = res.data.data
        setCompany(data.company || '')
        setPosition(data.position || '')
        setIndustry(data.industry || '')
        setSalary(data.salary || '')
        setLocation(data.location || '')
        setEducation(data.education || '')
        setJdText(data.jd_text || '')
        setCardId(data.id)
        if (data.resume_tips || data.hidden_requirements) {
          setStrategy(data)
        }
      }
    } catch (err) {
      console.log('Load card error:', err)
    }
  }

  const handleSaveAndParse = async () => {
    if (!company || !position) {
      Taro.showToast({ title: '请填写公司和岗位', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      // 1. 先保存岗位卡片
      const res = await Network.request({
        url: '/api/jobs',
        method: 'POST',
        data: { company, position, jd_text: jdText, industry, salary, location, education }
      })
      console.log('Save job response:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        const savedCard = res.data.data
        setCardId(savedCard.id)

        // 2. 如果有JD，自动调用AI解析
        if (jdText) {
          setStrategyLoading(true)
          try {
            const aiRes = await Network.request({
              url: '/api/ai/chat',
              method: 'POST',
              data: { action: 'strategy', jd_text: jdText }
            })
            console.log('AI strategy response:', aiRes.data)
            if (aiRes.data?.code === 0 && aiRes.data?.data) {
              const strategyData = aiRes.data.data
              setStrategy(strategyData)

              // 3. 把AI结果回写到岗位卡片
              await Network.request({
                url: `/api/jobs/${savedCard.id}`,
                method: 'PUT',
                data: {
                  resume_tips: strategyData.resume_tips || '',
                  hidden_requirements: strategyData.hidden_requirements || '',
                  hr_questions_prediction: strategyData.hr_questions_prediction || [],
                  actions: strategyData.actions || [],
                  status: 'interested'
                }
              })
            }
          } catch (aiErr) {
            console.log('AI parse error:', aiErr)
            Taro.showToast({ title: 'AI解析失败，请稍后重试', icon: 'none' })
          } finally {
            setStrategyLoading(false)
          }
        }

        Taro.showToast({ title: '任务领取成功', icon: 'success' })
      }
    } catch (err) {
      console.log('Save job error:', err)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const handleReParse = async () => {
    if (!jdText) {
      Taro.showToast({ title: '请先输入JD内容', icon: 'none' })
      return
    }
    setStrategyLoading(true)
    try {
      const aiRes = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: { action: 'strategy', jd_text: jdText }
      })
      console.log('AI re-parse response:', aiRes.data)
      if (aiRes.data?.code === 0 && aiRes.data?.data) {
        const strategyData = aiRes.data.data
        setStrategy(strategyData)

        // 回写AI结果
        if (cardId) {
          await Network.request({
            url: `/api/jobs/${cardId}`,
            method: 'PUT',
            data: {
              resume_tips: strategyData.resume_tips || '',
              hidden_requirements: strategyData.hidden_requirements || '',
              hr_questions_prediction: strategyData.hr_questions_prediction || [],
              actions: strategyData.actions || []
            }
          })
        }
      }
    } catch (err) {
      console.log('Re-parse error:', err)
      Taro.showToast({ title: 'AI解析失败', icon: 'none' })
    } finally {
      setStrategyLoading(false)
    }
  }

  return (
    <View className="min-h-full bg-background">
      {/* 顶部标题栏 */}
      <View className="bg-background px-4 pt-2 pb-3 flex flex-row items-center gap-3">
        <View onClick={() => Taro.navigateBack()} className="p-1">
          <ArrowLeft size={20} color="#3A4A44" />
        </View>
        <Text className="block text-lg font-bold text-foreground">领取新任务</Text>
      </View>

      <View className="px-4">
        {/* 基本信息 */}
        <Card className="mb-4 shadow-card">
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-4">
              <Target size={16} color="#3A4A44" />
              <Text className="block font-semibold text-foreground">目标岗位</Text>
            </View>
            <View className="mb-3">
              <Text className="block text-xs text-muted-foreground mb-2">公司名称</Text>
              <View className="bg-muted rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm text-foreground"
                  placeholder="输入公司名称"
                  value={company}
                  onInput={(e) => setCompany(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-xs text-muted-foreground mb-2">岗位名称</Text>
              <View className="bg-muted rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent text-sm text-foreground"
                  placeholder="输入岗位名称"
                  value={position}
                  onInput={(e) => setPosition(e.detail.value)}
                />
              </View>
            </View>
            {/* 行业/薪资 行 */}
            <View className="flex flex-row gap-3 mt-3">
              <View className="flex-1">
                <Text className="block text-xs text-muted-foreground mb-2">行业</Text>
                <View className="bg-muted rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent text-sm text-foreground"
                    placeholder="如：互联网"
                    value={industry}
                    onInput={(e) => setIndustry(e.detail.value)}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-muted-foreground mb-2">薪资范围</Text>
                <View className="bg-muted rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent text-sm text-foreground"
                    placeholder="如：20-40K"
                    value={salary}
                    onInput={(e) => setSalary(e.detail.value)}
                  />
                </View>
              </View>
            </View>
            {/* 地点/学历 行 */}
            <View className="flex flex-row gap-3 mt-3">
              <View className="flex-1">
                <Text className="block text-xs text-muted-foreground mb-2">地点</Text>
                <View className="bg-muted rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent text-sm text-foreground"
                    placeholder="如：北京"
                    value={location}
                    onInput={(e) => setLocation(e.detail.value)}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="block text-xs text-muted-foreground mb-2">学历要求</Text>
                <View className="bg-muted rounded-lg px-4 py-3">
                  <Input
                    className="w-full bg-transparent text-sm text-foreground"
                    placeholder="如：本科"
                    value={education}
                    onInput={(e) => setEducation(e.detail.value)}
                  />
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* JD 输入区 */}
        <Card className="mb-4 shadow-card">
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <FileText size={16} color="#3A4A44" />
              <Text className="block font-semibold text-foreground">职位描述 (JD)</Text>
            </View>
            <View className="bg-muted rounded-lg p-3">
              <Textarea
                style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent', fontSize: '13px' }}
                placeholder="粘贴岗位JD，AI将逆向解析隐性需求..."
                value={jdText}
                onInput={(e) => setJdText(e.detail.value)}
              />
            </View>
            {cardId && strategy ? (
              <Button
                className="w-full mt-3"
                disabled={strategyLoading || !jdText}
                onClick={handleReParse}
              >
                <Sparkles size={16} color="#fff" />
                <Text className="text-primary-foreground ml-1">{strategyLoading ? 'AI解析中...' : '重新解析'}</Text>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        {/* AI 策略结果 */}
        {strategy && (
          <Card className="mb-4 shadow-card">
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-2 mb-4">
                <Sparkles size={16} color="#E26A5C" />
                <Text className="block font-semibold text-foreground">AI攻略策略</Text>
                <Badge className="bg-primary bg-opacity-15 text-primary border-none ml-auto">
                  <Text className="text-xs">已解锁</Text>
                </Badge>
              </View>

              {strategy.resume_tips && (
                <View className="mb-4">
                  <View className="flex flex-row items-center gap-2 mb-2">
                    <View className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center">
                      <Shield size={12} color="#3A4A44" />
                    </View>
                    <Text className="block text-sm font-medium text-foreground">简历修饰建议</Text>
                  </View>
                  <Text className="block text-sm text-muted-foreground leading-relaxed pl-8">{strategy.resume_tips}</Text>
                </View>
              )}

              {strategy.hidden_requirements && (
                <View className="mb-4">
                  <View className="flex flex-row items-center gap-2 mb-2">
                    <View className="w-6 h-6 rounded-full bg-warning-container flex items-center justify-center">
                      <Lightbulb size={12} color="#D4A017" />
                    </View>
                    <Text className="block text-sm font-medium text-foreground">隐性需求</Text>
                  </View>
                  <Text className="block text-sm text-muted-foreground leading-relaxed pl-8">{strategy.hidden_requirements}</Text>
                </View>
              )}

              {strategy.hr_questions_prediction?.length > 0 && (
                <View className="mb-4">
                  <View className="flex flex-row items-center gap-2 mb-2">
                    <View className="w-6 h-6 rounded-full bg-error-container flex items-center justify-center">
                      <MessageCircle size={12} color="#E26A5C" />
                    </View>
                    <Text className="block text-sm font-medium text-foreground">HR可能的问题</Text>
                  </View>
                  <View className="pl-8">
                    {strategy.hr_questions_prediction.map((q: string, i: number) => (
                      <View key={i} className="flex flex-row items-start gap-2 mb-2">
                        <View className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                          <Text className="text-xs text-primary font-semibold">{i + 1}</Text>
                        </View>
                        <Text className="text-sm text-muted-foreground">{q}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {strategy.actions?.length > 0 && (
                <View>
                  <View className="flex flex-row items-center gap-2 mb-2">
                    <View className="w-6 h-6 rounded-full bg-success-container flex items-center justify-center">
                      <Target size={12} color="#5B9A6F" />
                    </View>
                    <Text className="block text-sm font-medium text-foreground">行动建议</Text>
                  </View>
                  <View className="pl-8">
                    {strategy.actions.map((a: string, i: number) => (
                      <View key={i} className="flex flex-row items-start gap-2 mb-2">
                        <View className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                        <Text className="text-sm text-muted-foreground">{a}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* 解析中提示 */}
        {strategyLoading && (
          <Card className="mb-4 shadow-card">
            <CardContent className="p-6 flex flex-col items-center">
              <Sparkles size={32} color="#3A4A44" />
              <Text className="block text-foreground font-semibold mt-3">AI正在解析JD</Text>
              <Text className="block text-muted-foreground text-sm mt-1">分析隐性需求和面试策略...</Text>
            </CardContent>
          </Card>
        )}

        {/* 底部提交按钮 */}
        <View className="pb-8">
          <Button
            className="w-full"
            disabled={saving || strategyLoading || !company || !position}
            onClick={handleSaveAndParse}
          >
            <Sparkles size={16} color="#fff" />
            <Text className="text-primary-foreground ml-1">
              {saving ? '保存中...' : strategyLoading ? '解析中...' : '领取任务并解析JD'}
            </Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
