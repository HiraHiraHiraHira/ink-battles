'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface LoadingProgressProps {
  open: boolean
}

const stages = [
  { text: '正在解析内容...', icon: '📝' },
  { text: '分析文本结构...', icon: '🔍' },
  { text: 'AI 深度理解中...', icon: '🧠' },
  { text: '生成评估报告...', icon: '📊' },
  { text: '优化分析结果...', icon: '✨' }
]

export default function LoadingProgress({ open }: LoadingProgressProps) {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    if (!open) {
      setStageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [open])

  const currentStage = stages[stageIndex]

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            分析进行中
          </DialogTitle>
          <DialogDescription>
            正在使用 AI 分析您的作品，请稍候...
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center">
          {/* 加载动画 */}
          <div className="relative w-20 h-20 mb-6">
            {/* 外圈旋转 */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-primary/20"
              style={{ borderTopColor: 'hsl(var(--primary))' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            />
            {/* 内圈反向旋转 */}
            <motion.div
              className="absolute inset-2 rounded-full border-4 border-primary/10"
              style={{ borderBottomColor: 'hsl(var(--primary) / 0.6)' }}
              animate={{ rotate: -360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            />
            {/* 中心图标 */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-2xl"
              key={stageIndex}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentStage.icon}
            </motion.div>
          </div>

          {/* 阶段文字 */}
          <motion.p
            key={stageIndex}
            className="text-base font-medium text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentStage.text}
          </motion.p>

          {/* 阶段指示器 */}
          <div className="flex gap-1.5 mt-4">
            {stages.map((_, i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === stageIndex ? 'bg-primary' : 'bg-muted'
                }`}
                animate={i === stageIndex ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            ))}
          </div>

          {/* 提示文字 */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            分析时长取决于内容长度，通常需要 1-3 分钟
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
