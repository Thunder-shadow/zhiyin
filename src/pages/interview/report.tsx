import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Star, Lightbulb, ChevronLeft } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

/** 面试报告页 - 雷达图 + 文字评语 */
export default function InterviewReport() {
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.data) {
      try {
        setReport(JSON.parse(decodeURIComponent(params.data)))
      } catch (e) {
        console.log('Parse report error:', e)
      }
    }
  }, [])

  const radarLabels = [
    { key: 'radar_logic', label: '逻辑思维', icon: '🧠' },
    { key: 'radar_stress', label: '抗压能力', icon: '💪' },
    { key: 'radar_expression', label: '表达力', icon: '🗣' },
    { key: 'radar_trust', label: '可信度', icon: '🤝' },
    { key: 'radar_profession', label: '专业度', icon: '📋' },
  ]

  return (
    <View className="min-h-full bg-background px-4 pt-4 pb-8">
      {/* 返回按钮 */}
      <View className="flex flex-row items-center gap-2 mb-4" onClick={() => Taro.navigateBack()}>
        <ChevronLeft size={20} color="#1A2B4C" />
        <Text className="block font-bold text-lg text-foreground">面试报告</Text>
      </View>

      {/* 总评 */}
      <Card className="mb-4 shadow-sm">
        <CardContent className="p-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <Trophy size={20} color="#FF6B35" />
            <Text className="block font-bold text-foreground text-base">总评</Text>
          </View>
          <Text className="block text-sm text-foreground leading-relaxed">
            {report?.overall_comment || '面试报告生成中，请稍后查看。'}
          </Text>
        </CardContent>
      </Card>

      {/* 雷达图数据（用进度条替代，兼容跨端） */}
      <Card className="mb-4 shadow-sm">
        <CardContent className="p-4">
          <Text className="block font-bold text-foreground mb-3">能力雷达</Text>
          <View className="flex flex-col gap-3">
            {radarLabels.map((item) => {
              const value = report?.[item.key] || 0
              return (
                <View key={item.key}>
                  <View className="flex flex-row items-center justify-between mb-1">
                    <Text className="text-sm text-foreground">{item.icon} {item.label}</Text>
                    <Text className="text-sm font-mono text-accent">{value}/100</Text>
                  </View>
                  <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${value}%`,
                        background: value >= 80 ? '#10B981' : value >= 60 ? '#FF6B35' : '#EF4444',
                        transition: 'width 0.5s ease-in-out',
                      }}
                    />
                  </View>
                </View>
              )
            })}
          </View>
        </CardContent>
      </Card>

      {/* 亮点和改进 */}
      {report?.highlights && (
        <Card className="mb-4 shadow-sm">
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-2">
              <Star size={16} color="#10B981" />
              <Text className="block font-semibold text-foreground">亮点</Text>
            </View>
            <Text className="block text-sm text-foreground leading-relaxed">{report.highlights}</Text>
          </CardContent>
        </Card>
      )}
      {report?.improvements && (
        <Card className="mb-4 shadow-sm">
          <CardContent className="p-4">
            <View className="flex flex-row items-center gap-2 mb-2">
              <Lightbulb size={16} color="#F59E0B" />
              <Text className="block font-semibold text-foreground">改进建议</Text>
            </View>
            <Text className="block text-sm text-foreground leading-relaxed">{report.improvements}</Text>
          </CardContent>
        </Card>
      )}

      <Button className="w-full bg-primary text-white border-none rounded-lg mt-4" onClick={() => Taro.switchTab({ url: '/pages/interview/lobby' })}>
        <Text className="text-white">返回训练场</Text>
      </Button>
    </View>
  )
}
