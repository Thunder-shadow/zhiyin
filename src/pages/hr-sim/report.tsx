import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileCheck, Loader, BookOpen, ExternalLink } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import { Network } from '@/network'

export default function HrReport() {
  const [step, setStep] = useState<'loading' | 'result'>('loading')
  const [hrNotes, setHrNotes] = useState('')
  const [loaded, setLoaded] = useState(false)
  const generatedRef = useRef(false)

  const candidateName = useRef('')
  const resumeIndex = useRef(0)
  const candidateId = useRef('')

  useEffect(() => {
    setTimeout(() => setLoaded(true), 80)

    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const params = currentPage.options || {}
    candidateName.current = decodeURIComponent(params.candidateName || '候选人')
    resumeIndex.current = parseInt(params.resumeIndex || '0')
    candidateId.current = params.candidateId || ''
  }, [])

  useEffect(() => {
    if (generatedRef.current) return
    generatedRef.current = true
    generateReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateReport = async () => {
    const conversation = Taro.getStorageSync('hr_sim_conversation') || []
    // Try to get cached candidate data
    const cachedCandidate = Taro.getStorageSync('hr_selected_candidate')
    const requestData: any = {
      action: 'hr_sim_response',
      end: true,
      conversation: conversation.map((m: any) => ({ role: m.role, content: m.content })),
    }
    if (cachedCandidate) {
      requestData.candidate = {
        name: cachedCandidate.name,
        school: cachedCandidate.school,
        major: cachedCandidate.major,
        background: cachedCandidate.background,
        personality: cachedCandidate.personality,
        real_level: cachedCandidate.real_level,
      }
    } else {
      requestData.resume_index = resumeIndex.current
    }
    try {
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: requestData,
      })
      const data = res.data?.data || res.data
      const notes = data?.hr_notes || data?.reply || data?.message || '报告生成失败'
      setHrNotes(notes)
      setStep('result')

      // 保存到数据库
      saveReport(notes, conversation)
    } catch (err) {
      setHrNotes('报告生成失败，请稍后再试')
      setStep('result')
    }
  }

  const saveReport = async (notes: string, conversation: any[]) => {
    try {
      await Network.request({
        url: '/api/hr-reports',
        method: 'POST',
        data: {
          resume_index: resumeIndex.current,
          candidate_name: candidateName.current,
          report_content: notes,
          conversation,
        }
      })
    } catch (err) {
      }
  }

  return (
    <View className='min-h-full bg-background'>
      {/* 顶部 */}
      <View className='px-4 pt-3'>
        <Card className={`shadow-card overflow-hidden ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <View className='h-2' style={{ background: 'linear-gradient(90deg, #10B981, #059669, #047857)' }} />
          <CardContent className='p-4'>
            <View className='flex flex-row items-center gap-3'>
              <View className='w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0' style={{ overflow: 'hidden' }}>
                <FileCheck size={22} color='#10B981' />
              </View>
              <View className='flex-1 min-w-0'>
                <Text className='text-base font-semibold text-foreground'>
                  {step === 'loading' ? '生成招聘笔记' : '招聘笔记'}
                </Text>
                <Text className='text-xs text-muted-foreground mt-1'>候选人: {candidateName.current}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <View className='px-4 pt-5'>
        {step === 'loading' ? (
          <View className={`${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
            <Card className='shadow-card'>
              <CardContent className='p-6 flex flex-col items-center'>
                {/* 加载动画 */}
                <View
                  className='w-20 h-20 rounded-full flex items-center justify-center mb-5'
                  style={{ background: 'linear-gradient(135deg, #EDE9FE, #E0E7FF)' }}
                >
                  <Loader size={36} color='#7C3AED' className='animate-spin' />
                </View>
                <Text className='block text-base font-semibold text-foreground mb-2'>
                  正在生成招聘笔记...
                </Text>
                <Text className='block text-sm text-muted-foreground text-center leading-relaxed'>
                  AI正在分析面试对话，评估候选人表现
                </Text>

                {/* 进度提示 */}
                <View className='w-full mt-6'>
                  <View className='flex flex-row items-center gap-2 mb-3'>
                    <View className='w-2 h-2 rounded-full bg-violet-500 animate-pulse' />
                    <Text className='text-xs text-muted-foreground'>分析对话内容</Text>
                  </View>
                  <View className='flex flex-row items-center gap-2 mb-3'>
                    <View className='w-2 h-2 rounded-full bg-violet-400 animate-pulse' style={{ animationDelay: '0.3s' }} />
                    <Text className='text-xs text-muted-foreground'>评估候选人表现</Text>
                  </View>
                  <View className='flex flex-row items-center gap-2'>
                    <View className='w-2 h-2 rounded-full bg-violet-300 animate-pulse' style={{ animationDelay: '0.6s' }} />
                    <Text className='text-xs text-muted-foreground'>生成评估报告</Text>
                  </View>
                </View>

                <Text className='block text-xs text-muted-foreground mt-6' style={{ opacity: 0.6 }}>
                  你可以随时退出，报告会自动保存到「招聘笔记」
                </Text>
              </CardContent>
            </Card>
          </View>
        ) : (
          <View className={`${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
            <Card className='shadow-card mb-4'>
              <CardContent className='p-4'>
                <View className='flex flex-row items-center gap-2 mb-3'>
                  <View className='w-9 h-9 rounded-lg flex items-center justify-center' style={{ background: 'linear-gradient(135deg, #D1FAE5, #ECFDF5)' }}>
                    <FileCheck size={18} color='#10B981' />
                  </View>
                  <View>
                    <Text className='block font-semibold text-foreground'>评估报告</Text>
                    <Text className='block text-xs text-muted-foreground'>{candidateName.current}</Text>
                  </View>
                </View>
                <View className='h-px bg-outline-variant bg-opacity-15 my-3' />
                <Text className='block text-sm text-foreground leading-relaxed whitespace-pre-wrap'>{hrNotes}</Text>
              </CardContent>
            </Card>

            <View className='flex flex-col gap-3 pb-8'>
              <Button
                className='w-full btn-shimmer btn-press'
                onClick={() => {
                  Taro.removeStorageSync('hr_sim_conversation')
                  // 返回到选择页（delta 2: report -> interview -> select）
                  const pages = Taro.getCurrentPages()
                  const backDelta = Math.min(pages.length - 1, 2)
                  Taro.navigateBack({ delta: backDelta })
                }}
              >
                <BookOpen size={16} color='#fff' />
                <Text className='ml-1'>完成</Text>
              </Button>

              <Button
                variant='outline'
                className='w-full btn-press'
                onClick={() => {
                  Taro.removeStorageSync('hr_sim_conversation')
                  Taro.navigateTo({ url: '/pages/hr-sim/history' })
                }}
              >
                <ExternalLink size={14} color='#7C3AED' />
                <Text className='ml-1'>查看历史笔记</Text>
              </Button>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
