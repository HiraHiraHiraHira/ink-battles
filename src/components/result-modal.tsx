'use client'

import { useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { WriterAnalysisResult } from '@/app/page'
import {
  Camera,
  Download,
  X,
  Trophy,
  TrendingUp,
  Lightbulb,
  FileText,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface ResultModalProps {
  result: WriterAnalysisResult | null
  open: boolean
  onClose: () => void
}

export default function ResultModal({
  result,
  open,
  onClose
}: ResultModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return { text: 'text-emerald-500', bg: 'bg-emerald-500' }
    if (score >= 4) return { text: 'text-green-500', bg: 'bg-green-500' }
    if (score >= 3.5) return { text: 'text-lime-500', bg: 'bg-lime-500' }
    if (score >= 3) return { text: 'text-amber-500', bg: 'bg-amber-500' }
    if (score >= 2.5) return { text: 'text-orange-500', bg: 'bg-orange-500' }
    return { text: 'text-rose-500', bg: 'bg-rose-500' }
  }

  const handleScreenshot = useCallback(async () => {
    if (!contentRef.current || !result) return

    setIsCapturing(true)
    try {
      const { toPng } = await import('html-to-image')

      // 临时移除滚动限制以截取完整内容
      const scrollContainer = contentRef.current
      const originalStyle = {
        maxHeight: scrollContainer.style.maxHeight,
        overflow: scrollContainer.style.overflow
      }
      scrollContainer.style.maxHeight = 'none'
      scrollContainer.style.overflow = 'visible'

      // 等待样式应用
      await new Promise((r) => setTimeout(r, 100))

      const dataUrl = await toPng(scrollContainer, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        quality: 1,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      })

      // 恢复原始样式
      scrollContainer.style.maxHeight = originalStyle.maxHeight
      scrollContainer.style.overflow = originalStyle.overflow

      const link = document.createElement('a')
      link.download = `${result.title || '分析结果'}-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      toast.success('截图已保存')
    } catch (error) {
      console.error('Screenshot failed:', error)
      toast.error('截图失败，请重试')
    } finally {
      setIsCapturing(false)
    }
  }, [result])

  const handleDownloadMd = useCallback(() => {
    if (!result) return
    const md = generateMarkdown(result)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const link = document.createElement('a')
    link.download = `${result.title || '分析结果'}-${Date.now()}.md`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success('Markdown 文件已下载')
  }, [result])

  if (!result) return null

  const scoreColor = getScoreColor(result.overallScore)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 bg-background">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5" />
              分析报告
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleScreenshot}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                {isCapturing ? '生成中...' : '截图'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadMd}>
                <Download className="w-4 h-4 mr-2" />
                Markdown
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-6 py-6 bg-background"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {/* 总分卡片 - 更精致的设计 */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-6 mb-6 text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm text-slate-300">综合战力评估</p>
                <h3 className="text-2xl font-bold">{result.title}</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {result.ratingTag}
                </span>
              </div>
              <div className="text-right">
                <motion.div
                  className="text-6xl font-bold tabular-nums"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  {result.overallScore.toFixed(1)}
                </motion.div>
              </div>
            </div>
          </div>

          {/* 维度评分 - 更紧凑的网格 */}
          <div className="mb-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
              <Trophy className="w-5 h-5 text-amber-500" />
              维度评分
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.dimensions.map((dim, idx) => {
                const dimColor = getScoreColor(dim.score)
                return (
                  <div
                    key={idx}
                    className="bg-card rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{dim.name}</span>
                      <span className={`text-lg font-bold ${dimColor.text}`}>
                        {dim.score.toFixed(1)}
                      </span>
                    </div>
                    <Progress
                      value={(dim.score / 5) * 100}
                      className="h-1.5"
                    />
                    {dim.description && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {dim.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 整体评价 */}
          {result.overallAssessment && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-foreground">整体评价</h4>
              <div className="bg-card rounded-xl p-4 border text-muted-foreground leading-relaxed">
                {result.overallAssessment}
              </div>
            </div>
          )}

          {/* 优势与改进 - 并排卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                优势亮点
              </h4>
              <ul className="space-y-2">
                {result.strengths.length > 0 ? (
                  result.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-emerald-800 dark:text-emerald-300 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span>{s}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">暂无数据</li>
                )}
              </ul>
            </div>

            <div className="rounded-xl p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Lightbulb className="w-4 h-4" />
                改进建议
              </h4>
              <ul className="space-y-2">
                {result.improvements.length > 0 ? (
                  result.improvements.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2"
                    >
                      <span className="text-amber-500 mt-0.5">→</span>
                      <span>{s}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">暂无数据</li>
                )}
              </ul>
            </div>
          </div>

          {/* 作品概述 */}
          {result.comment && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-foreground">作品概述</h4>
              <div className="bg-card rounded-xl p-4 border text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {result.comment}
              </div>
            </div>
          )}

          {/* 结构分析 */}
          {result.structural_analysis && result.structural_analysis.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-foreground">结构分析</h4>
              <div className="bg-card rounded-xl p-4 border space-y-2">
                {result.structural_analysis.map((s, i) => (
                  <p key={i} className="text-muted-foreground text-sm">
                    {s}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 底部水印 */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            由 Ink Battles 生成 · {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="px-6 py-4 border-t shrink-0 bg-background flex justify-end">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function generateMarkdown(result: WriterAnalysisResult): string {
  let md = `# ${result.title}\n\n`
  md += `**综合评分**: ${result.overallScore.toFixed(1)}\n\n`
  md += `**评级**: ${result.ratingTag}\n\n`

  if (result.overallAssessment) {
    md += `## 整体评价\n\n${result.overallAssessment}\n\n`
  }

  md += `## 各维度评分\n\n`
  md += `| 维度 | 评分 | 说明 |\n`
  md += `| --- | --- | --- |\n`
  for (const dim of result.dimensions) {
    md += `| ${dim.name} | ${dim.score.toFixed(1)} | ${dim.description || '-'} |\n`
  }
  md += '\n'

  if (result.strengths.length > 0) {
    md += `## 优势亮点\n\n`
    for (const s of result.strengths) {
      md += `- ${s}\n`
    }
    md += '\n'
  }

  if (result.improvements.length > 0) {
    md += `## 改进建议\n\n`
    for (const s of result.improvements) {
      md += `- ${s}\n`
    }
    md += '\n'
  }

  if (result.comment) {
    md += `## 作品概述\n\n${result.comment}\n\n`
  }

  if (result.structural_analysis && result.structural_analysis.length > 0) {
    md += `## 结构分析\n\n`
    for (const s of result.structural_analysis) {
      md += `${s}\n\n`
    }
  }

  md += `---\n\n*由 Ink Battles 生成于 ${new Date().toLocaleString()}*\n`

  return md
}
