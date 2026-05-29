import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Save, ArrowLeft } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'

/** 简历编辑页 - 文本编辑 + JD匹配分析 */
export default function ResumeEditor() {
  const [resumeId, setResumeId] = useState('')
  const [versionName, setVersionName] = useState('')
  const [contentText, setContentText] = useState('')
  const [jdText, setJdText] = useState('')
  const [matchResult, setMatchResult] = useState<any>(null)
  const [isMatching, setIsMatching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.id) {
      setResumeId(params.id)
      loadResume(params.id)
    } else {
      setTimeout(() => setLoaded(true), 80)
    }
  }, [])

  const loadResume = async (id: string) => {
    try {
      const res = await Network.request({ url: `/api/resumes/${id}` })
      console.log('Resume detail:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        const d = res.data.data
        setVersionName(d.version_name || '')
        setContentText(d.content_text || '')
      }
    } catch (err) {
      console.log('Load resume error:', err)
    } finally {
      setTimeout(() => setLoaded(true), 80)
    }
  }

  const saveResume = async () => {
    if (!versionName.trim() || !contentText.trim()) return
    setIsSaving(true)
    try {
      const url = resumeId ? `/api/resumes/${resumeId}` : '/api/resumes'
      const method = resumeId ? 'PUT' : 'POST'
      const res = await Network.request({
        url,
        method,
        data: { version_name: versionName, content_text: contentText }
      })
      console.log('Save resume:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        if (!resumeId) setResumeId(res.data.data.id)
        Taro.showToast({ title: '保存成功', icon: 'success' })
      }
    } catch (err) {
      console.log('Save resume error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const matchResume = async () => {
    if (!contentText.trim() || !jdText.trim() || isMatching) return
    setIsMatching(true)
    try {
      const res = await Network.request({
        url: '/api/ai/chat',
        method: 'POST',
        data: { action: 'resume_match', resume_text: contentText, jd_text: jdText, resume_id: resumeId }
      })
      console.log('Match result:', res.data)
      if (res.data?.code === 0 && res.data?.data) {
        setMatchResult(res.data.data)
      }
    } catch (err) {
      console.log('Match error:', err)
    } finally {
      setIsMatching(false)
    }
  }

  return (
    <View className='min-h-full bg-background'>
      {/* 顶部 */}
      <View className='bg-gradient-to-br from-emerald-500 to-teal-600 px-4 pt-4 pb-6 rounded-b-3xl'>
        <View className='flex flex-row items-center gap-2'>
          <View onClick={() => Taro.navigateBack()} className='p-1'>
            <ArrowLeft size={20} color='#fff' />
          </View>
          <Text className='block text-white font-bold text-lg'>编辑简历</Text>
        </View>
      </View>

      <View className='px-4 -mt-3'>
        {/* 版本名称 */}
        <Card className={`shadow-sm mb-3 ${loaded ? 'anim-fade-in-up' : 'opacity-0'}`}>
          <CardContent className='p-4'>
            <Text className='block text-sm text-gray-500 mb-1'>版本名称</Text>
            <View className='bg-gray-50 rounded-xl px-3 py-2'>
              <Input
                style={{ width: '100%', fontSize: '14px', backgroundColor: 'transparent' }}
                placeholder='如：投递字节产品岗 v1'
                value={versionName}
                onInput={(e) => setVersionName(e.detail.value)}
              />
            </View>
          </CardContent>
        </Card>

        {/* 简历内容 */}
        <Card className={`shadow-sm mb-3 ${loaded ? 'anim-fade-in-up anim-delay-1' : 'opacity-0'}`}>
          <CardContent className='p-4'>
            <Text className='block text-sm text-gray-500 mb-1'>简历内容</Text>
            <View className='bg-gray-50 rounded-xl p-3'>
              <Textarea
                style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent', fontSize: '13px' }}
                placeholder='粘贴或输入你的简历内容...'
                value={contentText}
                onInput={(e) => setContentText(e.detail.value)}
                maxlength={5000}
              />
            </View>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <Button
          className={`w-full btn-shimmer mb-4 ${loaded ? 'anim-fade-in-up anim-delay-2' : 'opacity-0'}`}
          onClick={saveResume}
          disabled={isSaving}
        >
          <Save size={16} color='#fff' />
          <Text className='text-white ml-1'>{isSaving ? '保存中...' : '保存简历'}</Text>
        </Button>

        {/* JD 匹配分析 */}
        <Card className={`shadow-sm ${loaded ? 'anim-fade-in-up anim-delay-3' : 'opacity-0'}`}>
          <CardContent className='p-4'>
            <View className='flex flex-row items-center gap-2 mb-3'>
              <Sparkles size={16} color='#FF6B35' />
              <Text className='block font-semibold text-foreground'>JD匹配分析</Text>
            </View>
            <View className='mb-3'>
              <View className='bg-gray-50 rounded-xl p-3'>
                <Textarea
                  style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent', fontSize: '13px' }}
                  placeholder='粘贴目标岗位的JD...'
                  value={jdText}
                  onInput={(e) => setJdText(e.detail.value)}
                  maxlength={3000}
                />
              </View>
            </View>
            <Button className='w-full btn-shimmer' onClick={matchResume} disabled={isMatching || !jdText.trim()}>
              <Sparkles size={16} color='#fff' />
              <Text className='text-white ml-1'>{isMatching ? 'AI分析中...' : 'AI匹配分析'}</Text>
            </Button>
          </CardContent>
        </Card>

        {/* 匹配结果 */}
        {matchResult && (
          <Card className='mt-4 shadow-sm anim-fade-in-up'>
            <CardContent className='p-4'>
              <View className='flex flex-row items-center justify-between mb-2'>
                <Text className='block font-semibold text-foreground'>匹配结果</Text>
                <Badge className={`border-none text-sm font-bold ${matchResult.match_score >= 70 ? 'bg-emerald-50 text-emerald-600' : matchResult.match_score >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                  {matchResult.match_score}%
                </Badge>
              </View>
              <View className='w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3'>
                <View
                  className='h-full rounded-full progress-animated'
                  style={{
                    width: `${matchResult.match_score}%`,
                    backgroundColor: matchResult.match_score >= 70 ? '#10B981' : matchResult.match_score >= 50 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </View>
              {matchResult.suggestions && (
                <Text className='block text-sm text-foreground leading-relaxed'>{matchResult.suggestions}</Text>
              )}
            </CardContent>
          </Card>
        )}
      </View>
    </View>
  )
}
