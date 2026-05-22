import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Save, ChevronLeft } from 'lucide-react-taro'
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

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.id) {
      setResumeId(params.id)
      loadResume(params.id)
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
    <View className="min-h-full bg-background px-4 pt-4 pb-8">
      {/* 顶部 */}
      <View className="flex flex-row items-center gap-2 mb-4" onClick={() => Taro.navigateBack()}>
        <ChevronLeft size={20} color="#1A2B4C" />
        <Text className="block font-bold text-lg text-foreground">编辑简历</Text>
      </View>

      {/* 版本名称 */}
      <View className="mb-3">
        <Text className="block text-sm text-gray-500 mb-1">版本名称</Text>
        <Input
          className="bg-white rounded-xl"
          placeholder="如：投递字节产品岗 v1"
          value={versionName}
          onInput={(e) => setVersionName(e.detail.value)}
        />
      </View>

      {/* 简历内容 */}
      <View className="mb-3">
        <Text className="block text-sm text-gray-500 mb-1">简历内容</Text>
        <Textarea
          className="bg-white rounded-xl"
          placeholder="粘贴或输入你的简历内容..."
          value={contentText}
          onInput={(e) => setContentText(e.detail.value)}
          maxlength={5000}
        />
      </View>

      {/* 保存按钮 */}
      <Button className="w-full bg-primary text-white border-none rounded-lg mb-6" onClick={saveResume} disabled={isSaving}>
        <Save size={16} color="#fff" />
        <Text className="text-white ml-1">{isSaving ? '保存中...' : '保存简历'}</Text>
      </Button>

      {/* JD 匹配分析 */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <Sparkles size={16} color="#FF6B35" />
            <Text className="block font-semibold text-foreground">JD匹配分析</Text>
          </View>
          <View className="mb-3">
            <Textarea
              className="bg-gray-50 rounded-xl"
              placeholder="粘贴目标岗位的JD..."
              value={jdText}
              onInput={(e) => setJdText(e.detail.value)}
              maxlength={3000}
            />
          </View>
          <Button className="w-full bg-accent text-white border-none rounded-lg" onClick={matchResume} disabled={isMatching || !jdText.trim()}>
            <Sparkles size={16} color="#fff" />
            <Text className="text-white ml-1">{isMatching ? 'AI分析中...' : 'AI匹配分析'}</Text>
          </Button>
        </CardContent>
      </Card>

      {/* 匹配结果 */}
      {matchResult && (
        <Card className="mt-4 shadow-sm">
          <CardContent className="p-4">
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="block font-semibold text-foreground">匹配结果</Text>
              <Badge className={`${matchResult.match_score >= 80 ? 'bg-emerald-50 text-emerald-600' : matchResult.match_score >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'} border-none`}>
                匹配度 {matchResult.match_score}%
              </Badge>
            </View>
            {matchResult.suggestions && (
              <Text className="block text-sm text-foreground leading-relaxed">{matchResult.suggestions}</Text>
            )}
          </CardContent>
        </Card>
      )}
    </View>
  )
}
