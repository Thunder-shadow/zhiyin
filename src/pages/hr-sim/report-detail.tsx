import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, FileCheck, User, Clock, MessageSquare } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

interface HrReport {
  id: string
  candidate_name: string
  resume_index: number
  report_content: string
  conversation: any[]
  created_at: string
}

const RESUME_COLORS = ['#3B82F6', '#8B5CF6', '#10B981']

export default function HrReportDetail() {
  const [report, setReport] = useState<HrReport | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 80)

    const cached = Taro.getStorageSync('hr_view_report')
    if (cached) {
      setReport(cached)
    } else {
      Taro.navigateBack()
    }
  }, [])

  if (!report) return null

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <View className="min-h-full bg-background">
      {/* 顶部 */}
      <View
        className="px-4 pt-4 pb-3 rounded-b-2xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #8B5CF6 100%)' }}
      >
        <View className="absolute -top-4 -right-4 w-20 h-20 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
        <View className="flex flex-row items-center gap-3 relative">
          <View onClick={() => Taro.navigateBack()} className="p-1 btn-press">
            <ArrowLeft size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="block text-white font-bold text-base">招聘笔记详情</Text>
            <Text className="block text-gray-300 text-xs">候选人: {report.candidate_name}</Text>
          </View>
        </View>
      </View>

      <View className="px-4 pt-5 pb-6">
        {/* 候选人信息 */}
        <Card className={`shadow-card mb-4 ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-3">
              <View
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${RESUME_COLORS[report.resume_index % 3]}15` }}
              >
                <User size={24} color={RESUME_COLORS[report.resume_index % 3]} />
              </View>
              <View className="flex-1">
                <Text className="block font-semibold text-foreground">{report.candidate_name}</Text>
                <View className="flex flex-row items-center gap-1 mt-1">
                  <Clock size={11} color="#9CA3AF" />
                  <Text className="text-xs text-muted-foreground">{formatDate(report.created_at)}</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 报告内容 */}
        <Card className={`shadow-card mb-4 ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <View className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D1FAE5, #ECFDF5)' }}>
                <FileCheck size={18} color="#10B981" />
              </View>
              <Text className="block font-semibold text-foreground">评估报告</Text>
            </View>
            <View className="h-px bg-outline-variant bg-opacity-15 my-3" />
            <Text className="block text-sm text-foreground leading-relaxed whitespace-pre-wrap">{report.report_content}</Text>
          </CardContent>
        </Card>

        {/* 对话记录摘要 */}
        {report.conversation && report.conversation.length > 0 && (
          <Card className={`shadow-card ${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}>
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-2 mb-3">
                <View className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EDE9FE, #E0E7FF)' }}>
                  <MessageSquare size={18} color="#7C3AED" />
                </View>
                <Text className="block font-semibold text-foreground">面试对话记录</Text>
                <Text className="text-xs text-muted-foreground ml-auto">{report.conversation.length} 条</Text>
              </View>
              <View className="h-px bg-outline-variant bg-opacity-15 my-3" />
              {report.conversation.map((msg: any, idx: number) => (
                <View key={idx} className="mb-2">
                  <Text className="block text-xs font-semibold mb-1" style={{ color: msg.role === 'user' ? '#7C3AED' : '#10B981' }}>
                    {msg.role === 'user' ? 'HR (你)' : '候选人'}
                  </Text>
                  <Text className="block text-sm text-foreground leading-relaxed">{msg.content}</Text>
                  {idx < report.conversation.length - 1 && (
                    <View className="h-px bg-outline-variant bg-opacity-10 my-2" />
                  )}
                </View>
              ))}
            </CardContent>
          </Card>
        )}
      </View>
    </View>
  )
}
