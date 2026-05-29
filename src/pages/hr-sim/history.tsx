import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileCheck, Clock, ChevronRight, User, Trash2 } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

interface HrReport {
  id: string
  candidate_name: string
  resume_index: number
  report_content: string
  conversation: any[]
  created_at: string
}

const RESUME_COLORS = ['#3B82F6', '#8B5CF6', '#10B981']

export default function HrHistory() {
  const [reports, setReports] = useState<HrReport[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 80)
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const res = await Network.request({ url: '/api/hr-reports' })
      if (res.data?.code === 0) {
        setReports(res.data.data || [])
      }
    } catch (err) {
      console.error('Load reports error:', err)
    } finally {
      setLoading(false)
    }
  }

  const viewReport = (report: HrReport) => {
    Taro.setStorageSync('hr_view_report', report)
    Taro.navigateTo({ url: `/pages/hr-sim/report-detail?id=${report.id}` })
  }

  const deleteReport = async (id: string, e: any) => {
    e.stopPropagation()
    const { confirm } = await Taro.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定删除这份招聘笔记？',
      confirmText: '删除',
      confirmColor: '#EF4444',
    })
    if (!confirm) return

    try {
      await Network.request({ url: `/api/hr-reports/${id}`, method: 'DELETE' })
      setReports(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error('Delete report error:', err)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  return (
    <View className='min-h-full bg-background'>
      {/* 顶部 */}
      <View className='px-4 pt-3'>
        <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <View className='h-2' style={{ background: 'linear-gradient(90deg, #8B5CF6, #7C3AED, #6D28D9)' }} />
          <CardContent className='p-4'>
            <View className='flex flex-row items-center gap-3'>
              <View className='w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0' style={{ overflow: 'hidden' }}>
                <FileCheck size={22} color='#8B5CF6' />
              </View>
              <View className='flex-1 min-w-0'>
                <Text className='text-base font-semibold text-foreground'>招聘笔记</Text>
                <Text className='text-xs text-muted-foreground mt-1'>
                  {reports.length > 0 ? `共 ${reports.length} 份笔记` : '历史面试评估报告'}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <View className='px-4 pt-4 pb-6'>
        {loading ? (
          <View className={`${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
            {[1, 2, 3].map(i => (
              <Card key={i} className='shadow-card mb-3'>
                <CardContent className='p-4'>
                  <View className='flex flex-row items-center gap-3'>
                    <View className='w-10 h-10 rounded-xl bg-muted' />
                    <View className='flex-1'>
                      <View className='w-24 h-4 rounded bg-muted mb-2' />
                      <View className='w-40 h-3 rounded bg-muted' style={{ opacity: 0.5 }} />
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        ) : reports.length === 0 ? (
          <View className={`${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
            <Card className='shadow-card'>
              <CardContent className='p-8 flex flex-col items-center'>
                <View
                  className='w-20 h-20 rounded-full flex items-center justify-center mb-4'
                  style={{ background: 'linear-gradient(135deg, #EDE9FE, #E0E7FF)' }}
                >
                  <FileCheck size={36} color='#C4B5FD' />
                </View>
                <Text className='block text-base font-semibold text-foreground mb-2'>暂无笔记</Text>
                <Text className='block text-sm text-muted-foreground text-center leading-relaxed mb-5'>
                  完成HR模拟面试后{'\n'}招聘笔记会自动保存到这里
                </Text>
                <Button
                  variant='outline'
                  className='btn-press'
                  onClick={() => Taro.navigateTo({ url: '/pages/hr-sim/index' })}
                >
                  <Text>去体验HR模拟</Text>
                </Button>
              </CardContent>
            </Card>
          </View>
        ) : (
          <View>
            {reports.map((report, idx) => (
              <Card
                key={report.id}
                className={`shadow-card card-hover mb-3 ${loaded ? `anim-fade-in-up anim-delay-${Math.min(idx + 1, 5)}` : 'opacity-0'}`}
                onClick={() => viewReport(report)}
              >
                <CardContent className='p-4'>
                  <View className='flex flex-row items-start gap-3'>
                    {/* 候选人头像 */}
                    <View
                      className='w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0'
                      style={{ backgroundColor: `${RESUME_COLORS[report.resume_index % 3]}15` }}
                    >
                      <User size={22} color={RESUME_COLORS[report.resume_index % 3]} />
                    </View>
                    {/* 内容 */}
                    <View className='flex-1 min-w-0'>
                      <View className='flex flex-row items-center justify-between mb-1'>
                        <Text className='block font-semibold text-foreground'>{report.candidate_name}</Text>
                        <View
                          className='p-2 rounded-full btn-press'
                          onClick={(e) => deleteReport(report.id, e)}
                        >
                          <Trash2 size={14} color='#9CA3AF' />
                        </View>
                      </View>
                      <Text
                        className='block text-sm text-muted-foreground leading-relaxed'
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {report.report_content}
                      </Text>
                      <View className='flex flex-row items-center gap-1 mt-2'>
                        <Clock size={11} color='#9CA3AF' />
                        <Text className='text-xs text-muted-foreground'>{formatDate(report.created_at)}</Text>
                      </View>
                    </View>
                    {/* 箭头 */}
                    <ChevronRight size={16} color='#6B7B7480' className='flex-shrink-0 mt-1' />
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
