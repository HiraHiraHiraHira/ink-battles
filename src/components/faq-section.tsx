'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { cn } from '@/utils/utils'

const faqs = [
  {
    question: 'Ink Battles 是如何评分的？',
    answer:
      'Ink Battles 使用先进的大语言模型（LLM），结合文学理论和大量优秀作品数据，从情节、人物、节奏、文笔等多个维度对您的作品进行量化分析和定性评价。我们会模拟不同的读者视角（如普通读者、专业编辑、毒舌评论家）来提供全方位的反馈。'
  },
  {
    question: '我可以使用自己的 AI 模型吗？',
    answer:
      '可以！在"模型配置"中，您可以选择使用默认模型，或者配置自己的 API。目前支持 OpenAI、Anthropic、DeepSeek 等供应商，也可以填写自定义的 API 地址。您的 API Key 仅保存在本地浏览器中，不会上传到服务器。'
  },
  {
    question: '我的作品隐私安全吗？',
    answer:
      '非常安全。您的作品仅用于当次分析，我们不会存储您的原文，也不会将其用于训练 AI 模型。分析完成后，数据即被销毁。如果您使用自定义模型，数据将直接发送到您配置的 API 地址。'
  },
  {
    question: '支持哪些文件格式？',
    answer:
      '目前支持直接粘贴文本，以及上传 .txt、.docx 文档。我们也支持上传图片（如长图、截图），系统会自动识别其中的文字进行分析。建议上传纯文本内容以获得最准确的分析结果。'
  },
  {
    question: '如何保存和分享分析结果？',
    answer:
      '分析完成后，点击页面顶部的结果横幅即可打开详细报告弹窗。在弹窗中，您可以点击"截图"按钮将完整报告保存为图片，或点击"Markdown"按钮下载格式化的 MD 文件，方便分享到社交媒体或保存归档。'
  },
  {
    question: '分析需要多长时间？',
    answer:
      '通常情况下，一篇 5000 字左右的章节分析需要 30-60 秒。具体时间取决于文本长度、所选模型和当前服务器负载。在分析过程中，您可以看到实时的进度提示。'
  },
  {
    question: '评分结果准确吗？',
    answer:
      'AI 的评分基于客观指标和通用审美，具有很高的参考价值，能帮助您发现盲点（如节奏拖沓、人设扁平）。但文学创作具有主观性，建议将评分作为辅助参考，而非绝对标准。'
  }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4 text-primary">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold mb-4">常见问题</h2>
          <p className="text-muted-foreground">
            关于 Ink Battles 的一些常见疑问解答
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="border rounded-lg overflow-hidden bg-card"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex items-center justify-between w-full p-5 text-left hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium text-lg">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-muted-foreground transition-transform duration-200',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="p-5 pt-0 text-muted-foreground leading-relaxed border-t border-border/50 bg-accent/10">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
