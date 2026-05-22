import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Star, Lightbulb, ArrowLeft } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

/** 面试报告页 - 雷达图 + 文字评语 */
export default function InterviewReport() {
  const [report, setReport] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.data) {
      try {
        setReport(JSON.parse(decodeURIComponent(params.data)))
      } catch (e) {
        console.log('Parse report error:', e)
      }
    }
    setTimeout(() => setLoaded(true), 80)
  }, [])

  const radarLabels = [
    { key: 'radar_logic', label: '逻辑思维', icon: '🧠' },
    { key: 'radar_stress', label: '抗压能力', icon: '💪' },
    { key: 'radar_expression', label: '表达力', icon: '🗣' },
    { key: 'radar_trust', label: '可信度', icon: '🤝' },
    { key: 'radar_profession', label: '专业度', icon: '📋' },
  ]

  return (
    <View className="min-h-full bg-background">
      {/* 顶部 */}
      <View className="bg-gradient-to-br from-primary to-indigo-700 px-4 pt-4 pb-6 rounded-b-3xl">
        <View className="flex flex-row items-center gap-2" onClick={() => Taro.navigateBack()}>
          <ArrowLeft size={20} color="#fff" />
          <Text className="block font-bold text-lg text-white">面试报告</Text>
        </View>
      </View>

      <View className="px-4 -mt-3">
        {/* 总评 */}
        <Card className={`mb-4 shadow-sm ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
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
        <Card className={`mb-4 shadow-sm ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
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
                        className="h-full rounded-full progress-animated"
                        style={{
                          width: `${value}%`,
                          backgroundColor: value >= 80 ? '#10B981' : value >= 60 ? '#FF6B35' : '#EF4444',
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
          <Card className={`mb-4 shadow-sm ${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}>
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
          <Card className={`mb-4 shadow-sm ${loaded ? 'anim-fade-in-up anim-delay-3' : 'opacity-0'}`}>
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-2 mb-2">
                <Lightbulb size={16} color="#F59E0B" />
                <Text className="block font-semibold text-foreground">改进建议</Text>
              </View>
              <Text className="block text-sm text-foreground leading-relaxed">{report.improvements}</Text>
            </CardContent>
          </Card>
        )}

        <Button
          className={`w-full btn-shimmer mt-2 mb-4 ${loaded ? 'anim-fade-in-up anim-delay-4' : 'opacity-0'}`}
          onClick={() => Taro.navigateBack()}
        >
          <Text className="text-white">返回训练场</Text>
        </Button>
      </View>
    </View>
  )
}
