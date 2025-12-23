import type { NextRequest } from 'next/server'
import { generateText } from 'xsai'
import { buildPrompt } from '@/prompts'
import { calculateOverallScore } from '@/utils/score-calculator'
import { logger } from '@/utils/logger'

interface LlmApiConfig {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

interface CustomModelConfig {
  provider?: string
  apiKey?: string
  modelId?: string
  baseUrl?: string
  useDefault?: boolean
}

function getLlmApiConfig(customConfig?: CustomModelConfig): LlmApiConfig & { provider?: string } {
  // 如果提供了自定义配置且不使用默认模型
  if (customConfig && !customConfig.useDefault && customConfig.apiKey) {
    return {
      baseUrl: customConfig.baseUrl || String(process.env.OPENAI_BASE_URL),
      apiKey: customConfig.apiKey,
      model: customConfig.modelId || String(process.env.MODEL),
      temperature: Number(process.env.TEMPERATURE) || 1.2,
      maxTokens: Number(process.env.MAX_TOKENS) || 65536,
      provider: customConfig.provider
    }
  }

  // 使用默认配置
  return {
    baseUrl: String(process.env.OPENAI_BASE_URL),
    apiKey: String(process.env.OPENAI_API_KEY),
    model: String(process.env.MODEL),
    temperature: Number(process.env.TEMPERATURE) || 1.2,
    maxTokens: Number(process.env.MAX_TOKENS) || 65536
  }
}

// 检查供应商是否支持 json_schema 格式
function supportsJsonSchema(provider?: string): boolean {
  // OpenAI 支持 json_schema，DeepSeek 和 Anthropic 不支持
  const unsupportedProviders = ['deepseek', 'anthropic']
  return !provider || !unsupportedProviders.includes(provider.toLowerCase())
}

// 根据供应商获取 max_tokens 限制
function getMaxTokensForProvider(provider?: string, defaultMax?: number): number {
  const providerLimits: { [key: string]: number } = {
    deepseek: 8192,
    anthropic: 4096
  }
  if (provider && providerLimits[provider.toLowerCase()]) {
    return providerLimits[provider.toLowerCase()]
  }
  return defaultMax || 65536
}

function isValidLlmApiConfig(config: LlmApiConfig): boolean {
  return Boolean(config.apiKey)
}

export const maxDuration = 300 // 最大执行时间 5 分钟

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const content = formData.get('content') as string | null
    const file = formData.get('file') as File | null
    const analysisType = formData.get('analysisType') as 'text' | 'file'
    const optionsJson = formData.get('options') as string | null
    const options = optionsJson ? JSON.parse(optionsJson) : {}
    const modelConfigJson = formData.get('modelConfig') as string | null
    const modelConfig: CustomModelConfig | undefined = modelConfigJson
      ? JSON.parse(modelConfigJson)
      : undefined

    if (!analysisType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'analysisType 必填，应为 "text" 或 "file"'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (analysisType === 'text' && (!content || content.trim().length === 0)) {
      return new Response(
        JSON.stringify({ success: false, error: '文本内容不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (analysisType === 'file' && !file) {
      return new Response(
        JSON.stringify({ success: false, error: '文件/图片数据不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const apiConfig = getLlmApiConfig(modelConfig)
    if (!isValidLlmApiConfig(apiConfig)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: modelConfig && !modelConfig.useDefault
            ? '自定义模型配置无效，请检查 API Key 是否正确'
            : 'LLM API 配置无效，请检查环境变量设置'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendHeartbeat = () => {
          const heartbeat = `${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n`
          controller.enqueue(encoder.encode(heartbeat))
        }

        const heartbeatInterval = setInterval(sendHeartbeat, 10000)

        try {
          sendHeartbeat()

          const systemPrompt = buildPrompt(options ?? {})
          
          // 根据供应商决定 response_format
          const useJsonSchema = supportsJsonSchema(apiConfig.provider)
          
          const jsonSchemaFormat = {
            type: 'json_schema',
            json_schema: {
              name: 'analysis_response',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  overallAssessment: { type: 'string' },
                  title: { type: 'string' },
                  ratingTag: { type: 'string' },
                  dimensions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        score: { type: 'integer', minimum: 1, maximum: 5 },
                        description: { type: 'string' }
                      },
                      required: ['name', 'score', 'description'],
                      additionalProperties: false
                    }
                  },
                  strengths: { type: 'array', items: { type: 'string' } },
                  improvements: { type: 'array', items: { type: 'string' } },
                  comment: { type: 'string' },
                  structural_analysis: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  mermaid_diagrams: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        title: { type: 'string' },
                        code: { type: 'string' }
                      },
                      required: ['type', 'title', 'code'],
                      additionalProperties: false
                    }
                  }
                },
                required: [
                  'overallAssessment',
                  'title',
                  'ratingTag',
                  'dimensions',
                  'strengths',
                  'improvements',
                  'comment',
                  'structural_analysis',
                  'mermaid_diagrams'
                ],
                additionalProperties: false
              }
            }
          }

          const simpleJsonFormat = { type: 'json_object' }

          // 对于不支持 json_schema 的供应商，在 system prompt 中添加 JSON 格式说明
          const jsonFormatInstruction = !useJsonSchema ? `

请严格按照以下 JSON 格式返回分析结果：
{
  "overallAssessment": "整体评价文字",
  "title": "作品标题或概括",
  "ratingTag": "评级标签",
  "dimensions": [
    { "name": "维度名称", "score": 1-5的整数, "description": "维度描述" }
  ],
  "strengths": ["优点1", "优点2"],
  "improvements": ["改进建议1", "改进建议2"],
  "comment": "总体评语",
  "structural_analysis": ["结构分析1", "结构分析2"],
  "mermaid_diagrams": [
    { "type": "图表类型", "title": "图表标题", "code": "mermaid代码" }
  ]
}` : ''

          const finalSystemPrompt = systemPrompt + jsonFormatInstruction

          const requestConfig: any = {
            model: apiConfig.model,
            temperature: apiConfig.temperature,
            max_tokens: getMaxTokensForProvider(apiConfig.provider, apiConfig.maxTokens),
            response_format: useJsonSchema ? jsonSchemaFormat : simpleJsonFormat
          }

          let generatedText: string
          let messages: any[]

          if (analysisType === 'text') {
            messages = [
              { role: 'system', content: finalSystemPrompt },
              { role: 'user', content: content }
            ]
          } else {
            if (!file || !(file instanceof File)) {
              throw new Error('Invalid file object')
            }

            const isImage = file.type.startsWith('image/')
            if (!isImage) {
              throw new Error('Invalid file type')
            }

            const arrayBuffer = await file.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            const fileDataUrl = `data:${file.type};base64,${base64}`

            messages = [
              { role: 'system', content: finalSystemPrompt },
              {
                role: 'user',
                content: [
                  { type: 'text', text: '请分析此图片中的内容' },
                  { type: 'image_url', image_url: { url: fileDataUrl } }
                ]
              }
            ]
          }

          const genOptions = {
            apiKey: apiConfig.apiKey,
            baseURL: apiConfig.baseUrl,
            ...requestConfig,
            messages
          }

          const progressMsg =
            JSON.stringify({ type: 'progress', message: '正在分析中...' }) +
            '\n'
          controller.enqueue(encoder.encode(progressMsg))

          const { text } = await generateText(genOptions)
          generatedText = text as string

          if (!generatedText || generatedText.trim().length === 0) {
            logger.error('Missing content in AI response', { generatedText })
            throw new Error('分析失败，未能获取有效结果')
          }

          const result = JSON.parse(generatedText)
          if (!result || typeof result !== 'object') {
            logger.error('Parsed AI response is not a valid object', {
              generatedText
            })
            throw new Error('服务器无法处理 AI 响应')
          }

          const overallScore = calculateOverallScore(result.dimensions)
          const finalResult = { ...result, overallScore }

          const resultMsg = `${JSON.stringify({
            type: 'result',
            success: true,
            data: finalResult
          })}\n`
          controller.enqueue(encoder.encode(resultMsg))
        } catch (error: any) {
          logger.error('Error processing analysis request', error)
          const errorMsg = `${JSON.stringify({
            type: 'error',
            success: false,
            error: error.message || '处理请求时出错'
          })}\n`
          controller.enqueue(encoder.encode(errorMsg))
        } finally {
          clearInterval(heartbeatInterval)
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    })
  } catch (error: any) {
    logger.error('Error in analyze API route', error)
    return new Response(
      JSON.stringify({ success: false, error: '处理请求时出错' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
