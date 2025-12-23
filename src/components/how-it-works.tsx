'use client'

import { motion } from 'framer-motion'
import {
  PenLine,
  Settings2,
  Sliders,
  Sparkles,
  Share2,
  ArrowRight
} from 'lucide-react'

const steps = [
  {
    icon: PenLine,
    title: '1. 输入作品',
    description:
      '直接粘贴文本，或上传 TXT、Word 文档及图片。支持长篇小说片段或短篇故事。'
  },
  {
    icon: Settings2,
    title: '2. 配置模型',
    description:
      '可使用默认模型，或自定义配置 OpenAI、DeepSeek、Anthropic 等供应商的 API。'
  },
  {
    icon: Sliders,
    title: '3. 选择模式',
    description:
      '根据需要开启"初始门槛"、"文本法官"、"热血刺激"等多种评分视角。'
  },
  {
    icon: Sparkles,
    title: '4. 获取报告',
    description:
      'AI 将从多个维度进行深度拆解，生成详细的评分报告与改进建议。'
  },
  {
    icon: Share2,
    title: '5. 分享结果',
    description:
      '点击结果横幅查看完整报告，支持截图保存或下载 Markdown 文件分享。'
  }
]

export default function HowItWorks() {
  return (
    <section className="py-16 bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">使用流程</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            简单几步，即可获得专业的作品深度分析报告
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center relative"
            >
              <div className="w-20 h-20 rounded-full bg-background border-4 border-muted flex items-center justify-center mb-4 shadow-sm relative z-10">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs border-3 border-background">
                  {index + 1}
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed px-2">
                {step.description}
              </p>

              {/* 移动端箭头 */}
              {index < steps.length - 1 && (
                <div className="sm:hidden my-4 text-muted-foreground/30">
                  <ArrowRight className="w-6 h-6 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
