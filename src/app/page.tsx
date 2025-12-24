'use client'

import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'

import PageHeader from '@/components/page-header'
import ContentInputCard from '@/components/content-input-card'
import LoadingProgress from '@/components/loading-progress'
import AnalysisOptions from '@/components/analysis-options'
import ModelConfigCard, {
  type ModelConfig,
  DEFAULT_CONFIG
} from '@/components/model-config'
import ResultModal from '@/components/result-modal'
import AnimatedBackground from '@/components/animated-background'
import FeaturesSection from '@/components/features-section'

export interface MermaidDiagram {
  type: string
  title: string
  code: string
}

export interface WriterAnalysisResult {
  overallScore: number
  overallAssessment: string
  title: string
  ratingTag: string
  dimensions: {
    name: string
    score: number
    description: string
  }[]
  strengths: string[]
  improvements: string[]
  comment?: string
  structural_analysis?: string[]
  mermaid_diagrams?: MermaidDiagram[]
}

export default function WriterAnalysisPage() {
  const [content, setContent] = useState<string>('')
  const [uploadedText, setUploadedText] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analysisType, setAnalysisType] = useState<'text' | 'file'>('text')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [result, setResult] = useState<WriterAnalysisResult | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [enabledOptions, setEnabledOptions] = useState<{
    [key: string]: boolean
  }>({
    initialScore: false,
    productionQuality: false,
    contentReview: false,
    textStyle: false,
    hotTopic: false,
    antiCapitalism: false,
    speedReview: false
  })
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_CONFIG)

  const handleOptionChange = (key: string, value: boolean) => {
    setEnabledOptions({ ...enabledOptions, [key]: value })
  }

  useEffect(() => {
    if (file?.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [file])

  const handleAnalyze = async () => {
    const isFileModeText =
      analysisType === 'file' &&
      !!file &&
      (file.type === 'text/plain' ||
        file.name.toLowerCase().endsWith('.txt') ||
        file.name.toLowerCase().endsWith('.docx'))

    if (analysisType === 'text' && !content.trim()) {
      toast.error('文本内容为空，请先输入或正确导入文本')
      return
    }

    if (isFileModeText && !uploadedText.trim()) {
      toast.error('上传的文本内容为空，请检查文件内容')
      return
    }

    if (analysisType === 'file' && !isFileModeText && !file) {
      toast.error('请先上传图片文件再进行分析')
      return
    }

    setIsLoading(true)
    setProgress(10)
    setResult(null)

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const increment = Math.max(1, 10 - Math.floor(prev / 10))
          const newProgress = prev + increment
          if (newProgress >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return newProgress
        })
      }, 500)

      try {
        const formData = new FormData()

        const contentToSubmit =
          analysisType === 'text' ? content : isFileModeText ? uploadedText : ''

        if (contentToSubmit) {
          formData.append('content', contentToSubmit)
        }

        if (analysisType === 'file' && !isFileModeText && file) {
          formData.append('file', file)
        }

        formData.append('analysisType', isFileModeText ? 'text' : analysisType)
        formData.append('options', JSON.stringify(enabledOptions))
        formData.append('modelConfig', JSON.stringify(modelConfig))

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`)
        }

        if (!response.body) {
          throw new Error('响应体为空')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim()) continue

            try {
              const message = JSON.parse(line)

              if (message.type === 'heartbeat') {
                console.log(
                  '收到心跳:',
                  new Date(message.timestamp).toLocaleTimeString()
                )
              } else if (message.type === 'progress') {
                console.log('进度:', message.message)
              } else if (message.type === 'result' && message.success) {
                const data = message.data
                if (!data || typeof data !== 'object') {
                  throw new Error('返回的分析结果格式无效')
                }
                if (
                  !('dimensions' in data) ||
                  !Array.isArray(data.dimensions)
                ) {
                  toast.warning('分析数据不完整，部分功能可能受到影响')
                  data.dimensions = data.dimensions || []
                }

                const defaultResult: WriterAnalysisResult = {
                  overallScore: 0,
                  overallAssessment: '暂无整体评估',
                  title: '分析结果',
                  ratingTag: '未知',
                  dimensions: [],
                  strengths: [],
                  improvements: [],
                  structural_analysis: [],
                  mermaid_diagrams: []
                }

                const safeData = { ...defaultResult, ...data }

                clearInterval(progressInterval)
                setProgress(100)
                setResult(safeData)
                setShowResultModal(true)
              } else if (message.type === 'error') {
                throw new Error(message.error || '分析失败')
              }
            } catch (parseError) {
              console.warn('解析消息失败:', line, parseError)
            }
          }
        }
      } catch (error: any) {
        console.error('Analysis data error:', error)
        toast.error(`分析错误: ${error?.message || '未知错误'}`)
      }
    } catch (error: any) {
      console.error('Analysis process error:', error)
      toast.error(`分析失败: ${error?.message || '请检查您的网络并稍后重试'}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  return (
    <div className="w-full">
      <div className="max-w-300 w-full mx-auto px-4 sm:px-6 py-8">
        <PageHeader />

        <div className="mb-16" id="analysis-tool">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">开始您的创作分析</h2>
            <p className="text-muted-foreground">
              选择输入方式和评分模式，获取深度洞察
            </p>
          </div>

          {/* 分析结果横幅 */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="mb-8"
              >
                <div
                  onClick={() => setShowResultModal(true)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && setShowResultModal(true)
                  }
                  role="button"
                  tabIndex={0}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-6 cursor-pointer hover:shadow-2xl hover:shadow-primary/25 transition-all duration-300 group"
                >
                  {/* 背景装饰 */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                  <div className="relative flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-6">
                      {/* 分数显示 - 渐变文字效果 */}
                      <div className="relative flex items-baseline gap-1">
                        <span 
                          className="text-6xl font-black tabular-nums bg-gradient-to-b from-white via-white/90 to-white/60 bg-clip-text text-transparent"
                        >
                          {result.overallScore.toFixed(1)}
                        </span>
                        <span className="text-lg font-medium text-white/50">分</span>
                      </div>

                      <div className="text-white">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-white/70">✨ 分析完成</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <p className="text-xl font-bold mb-2">{result.title}</p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm">
                          {result.ratingTag}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-white/70 hidden sm:block">
                        点击查看完整报告
                      </span>
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <motion.div
              className="content-start space-y-4 self-start"
              initial={{ opacity: 0, x: -30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{
                duration: 0.7,
                ease: [0.23, 1, 0.32, 1],
                type: 'spring',
                stiffness: 100,
                damping: 15
              }}
            >
              <ContentInputCard
                content={content}
                setContentAction={setContent}
                setFileAction={setFile}
                file={file}
                previewUrl={previewUrl}
                isLoading={isLoading}
                onAnalyzeAction={handleAnalyze}
                analysisType={analysisType}
                setAnalysisTypeAction={(t) => setAnalysisType(t)}
                setUploadedTextAction={setUploadedText}
              />
            </motion.div>

            <motion.div
              className="space-y-6 content-start self-start"
              initial={{ opacity: 0, x: 30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{
                duration: 0.7,
                ease: [0.23, 1, 0.32, 1],
                delay: 0.15,
                type: 'spring',
                stiffness: 100,
                damping: 15
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <ModelConfigCard
                  config={modelConfig}
                  onChange={setModelConfig}
                  disabled={isLoading}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <AnalysisOptions
                  options={enabledOptions}
                  onChange={handleOptionChange}
                  disabled={isLoading}
                />
              </motion.div>


            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-300 w-full mx-auto px-4 sm:px-6">
        <FeaturesSection />
      </div>

      <LoadingProgress open={isLoading} />

      <ResultModal
        result={result}
        open={showResultModal}
        onClose={() => setShowResultModal(false)}
      />

      <Toaster position="top-right" />
      <AnimatedBackground />
    </div>
  )
}
