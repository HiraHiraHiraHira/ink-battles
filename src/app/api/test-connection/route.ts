import type { NextRequest } from 'next/server'
import { generateText } from 'xsai'
import { logger } from '@/utils/logger'

interface CustomModelConfig {
  provider?: string
  apiKey?: string
  modelId?: string
  baseUrl?: string
  useDefault?: boolean
}

function getLlmApiConfig(customConfig?: CustomModelConfig) {
  if (customConfig && !customConfig.useDefault && customConfig.apiKey) {
    return {
      baseUrl: customConfig.baseUrl || String(process.env.OPENAI_BASE_URL),
      apiKey: customConfig.apiKey,
      model: customConfig.modelId || String(process.env.MODEL),
      provider: customConfig.provider
    }
  }

  return {
    baseUrl: String(process.env.OPENAI_BASE_URL),
    apiKey: String(process.env.OPENAI_API_KEY),
    model: String(process.env.MODEL)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const modelConfig: CustomModelConfig | undefined = body.modelConfig

    const apiConfig = getLlmApiConfig(modelConfig)

    if (!apiConfig.apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: modelConfig && !modelConfig.useDefault
            ? '请填写 API Key'
            : '服务器未配置默认模型'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 发送一个简单的测试请求
    const { text } = await generateText({
      apiKey: apiConfig.apiKey,
      baseURL: apiConfig.baseUrl,
      model: apiConfig.model,
      max_tokens: 10,
      messages: [
        { role: 'user', content: 'Hi' }
      ]
    })

    if (text) {
      return new Response(
        JSON.stringify({
          success: true,
          message: '连接成功',
          model: apiConfig.model
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: '未收到模型响应'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    logger.error('Connection test failed', error)
    
    const rawMessage = error.message || ''
    let errorMessage = '连接失败'
    let hint = ''

    if (rawMessage.includes('401') || rawMessage.includes('Unauthorized')) {
      errorMessage = 'API Key 无效或已过期'
    } else if (rawMessage.includes('404')) {
      errorMessage = '模型不存在或 API 地址错误'
    } else if (rawMessage.includes('429')) {
      errorMessage = '请求被限流'
      hint = '可能是 API 配额不足或请求过于频繁'
    } else if (rawMessage.includes('403') || rawMessage.includes('Forbidden')) {
      errorMessage = '访问被拒绝'
      hint = '请检查 API Key 权限或模型访问权限'
    } else if (rawMessage.includes('timeout') || rawMessage.includes('ETIMEDOUT')) {
      errorMessage = '连接超时'
      hint = '请检查网络或 API 地址是否正确'
    } else if (rawMessage.includes('ENOTFOUND') || rawMessage.includes('getaddrinfo')) {
      errorMessage = '无法解析域名'
      hint = '请检查 API 地址是否正确'
    } else if (rawMessage.includes('ECONNREFUSED')) {
      errorMessage = '连接被拒绝'
      hint = '请检查 API 地址和端口是否正确'
    } else if (rawMessage) {
      // 显示原始错误信息，但截断过长的内容
      errorMessage = rawMessage.length > 100 ? rawMessage.substring(0, 100) + '...' : rawMessage
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: hint ? `${errorMessage}（${hint}）` : errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
