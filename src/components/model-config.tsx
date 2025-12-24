'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/utils'
import {
  Settings2,
  ChevronDown,
  Server,
  Key,
  Cpu,
  Check,
  RotateCcw,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react'

export interface ModelConfig {
  provider: string
  apiKey: string
  modelId: string
  baseUrl: string
  useDefault: boolean
}

interface ModelConfigProps {
  config: ModelConfig
  onChange: (config: ModelConfig) => void
  disabled?: boolean
}

const DEFAULT_CONFIG: ModelConfig = {
  provider: '',
  apiKey: '',
  modelId: '',
  baseUrl: '',
  useDefault: true
}

const PROVIDER_PRESETS: {
  [key: string]: { name: string; baseUrl: string; models: string[] }
} = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307']
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  custom: {
    name: '自定义',
    baseUrl: '',
    models: []
  }
}

export default function ModelConfigCard({
  config,
  onChange,
  disabled = false
}: ModelConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localConfig, setLocalConfig] = useState<ModelConfig>(config)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  // 从 localStorage 加载配置
  useEffect(() => {
    const saved = localStorage.getItem('ink-battles-model-config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setLocalConfig(parsed)
        onChange(parsed)
      } catch (e) {
        console.error('Failed to parse saved model config')
      }
    }
  }, [])

  const handleChange = (updates: Partial<ModelConfig>) => {
    const newConfig = { ...localConfig, ...updates }
    setLocalConfig(newConfig)
    onChange(newConfig)
    // 保存到 localStorage
    localStorage.setItem('ink-battles-model-config', JSON.stringify(newConfig))
  }

  const handleProviderChange = (provider: string) => {
    const preset = PROVIDER_PRESETS[provider]
    if (preset) {
      handleChange({
        provider,
        baseUrl: preset.baseUrl,
        modelId: preset.models[0] || '',
        useDefault: false
      })
    }
  }

  const handleReset = () => {
    setLocalConfig(DEFAULT_CONFIG)
    onChange(DEFAULT_CONFIG)
    localStorage.removeItem('ink-battles-model-config')
  }

  const toggleDefault = () => {
    handleChange({ useDefault: !localConfig.useDefault })
  }

  const testConnection = async () => {
    setTestStatus('testing')
    setTestMessage('')

    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelConfig: localConfig })
      })

      const result = await response.json()

      if (result.success) {
        setTestStatus('success')
        setTestMessage(`连接成功 (${result.model})`)
      } else {
        setTestStatus('error')
        setTestMessage(result.error || '连接失败')
      }
    } catch (error: any) {
      setTestStatus('error')
      setTestMessage(error.message || '网络错误')
    }

    // 5秒后重置状态
    setTimeout(() => {
      setTestStatus('idle')
      setTestMessage('')
    }, 5000)
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              模型配置
            </CardTitle>
            <CardDescription className="mt-1">
              {localConfig.useDefault
                ? '使用项目默认模型'
                : `使用自定义模型: ${localConfig.modelId || '未配置'}`}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={disabled}
            className="h-8 px-2"
          >
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="px-0 space-y-4">
              {/* 使用默认模型开关 */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-pressed={localConfig.useDefault}
                  onClick={() => !disabled && toggleDefault()}
                  onKeyDown={(e) => {
                    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      toggleDefault()
                    }
                  }}
                  className={cn(
                    'relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                    localConfig.useDefault
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-muted hover:border-primary/50 bg-card hover:bg-accent/50',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        localConfig.useDefault
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Server size={18} />
                    </div>
                    <div>
                      <Label className="text-base font-semibold cursor-pointer">
                        使用默认模型
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        由项目作者配置的默认 AI 模型
                      </p>
                    </div>
                  </div>
                  {localConfig.useDefault && (
                    <Check className="text-primary h-5 w-5" />
                  )}
                </div>
              </motion.div>

              {/* 自定义配置区域 */}
              <AnimatePresence>
                {!localConfig.useDefault && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* 供应商选择 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">供应商</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(PROVIDER_PRESETS).map(
                          ([key, preset]) => (
                            <motion.button
                              key={key}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleProviderChange(key)}
                              disabled={disabled}
                              className={cn(
                                'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                                localConfig.provider === key
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-muted bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground'
                              )}
                            >
                              {preset.name}
                            </motion.button>
                          )
                        )}
                      </div>
                    </div>

                    {/* API Base URL */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        API Base URL
                      </Label>
                      <input
                        type="url"
                        value={localConfig.baseUrl}
                        onChange={(e) =>
                          handleChange({ baseUrl: e.target.value })
                        }
                        placeholder="https://api.openai.com/v1"
                        disabled={disabled}
                        className={cn(
                          'w-full px-4 py-2.5 rounded-lg border bg-background text-sm transition-all',
                          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                          'placeholder:text-muted-foreground/50',
                          disabled && 'opacity-50 cursor-not-allowed'
                        )}
                      />
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        API Key
                      </Label>
                      <input
                        type="password"
                        value={localConfig.apiKey}
                        onChange={(e) =>
                          handleChange({ apiKey: e.target.value })
                        }
                        placeholder="sk-..."
                        disabled={disabled}
                        className={cn(
                          'w-full px-4 py-2.5 rounded-lg border bg-background text-sm transition-all',
                          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                          'placeholder:text-muted-foreground/50',
                          disabled && 'opacity-50 cursor-not-allowed'
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        密钥仅存储在本地浏览器中，不会上传到服务器
                      </p>
                    </div>

                    {/* Model ID */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        模型 ID
                      </Label>
                      {localConfig.provider &&
                      localConfig.provider !== 'custom' &&
                      PROVIDER_PRESETS[localConfig.provider]?.models.length >
                        0 ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {PROVIDER_PRESETS[localConfig.provider].models.map(
                              (model) => (
                                <motion.button
                                  key={model}
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() =>
                                    handleChange({ modelId: model })
                                  }
                                  disabled={disabled}
                                  className={cn(
                                    'px-3 py-1.5 rounded-md border text-xs font-medium transition-all',
                                    localConfig.modelId === model
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-muted bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground'
                                  )}
                                >
                                  {model}
                                </motion.button>
                              )
                            )}
                          </div>
                          <input
                            type="text"
                            value={localConfig.modelId}
                            onChange={(e) =>
                              handleChange({ modelId: e.target.value })
                            }
                            placeholder="或输入自定义模型 ID"
                            disabled={disabled}
                            className={cn(
                              'w-full px-4 py-2.5 rounded-lg border bg-background text-sm transition-all',
                              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                              'placeholder:text-muted-foreground/50',
                              disabled && 'opacity-50 cursor-not-allowed'
                            )}
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={localConfig.modelId}
                          onChange={(e) =>
                            handleChange({ modelId: e.target.value })
                          }
                          placeholder="gpt-4o / claude-3-5-sonnet-20241022 / ..."
                          disabled={disabled}
                          className={cn(
                            'w-full px-4 py-2.5 rounded-lg border bg-background text-sm transition-all',
                            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                            'placeholder:text-muted-foreground/50',
                            disabled && 'opacity-50 cursor-not-allowed'
                          )}
                        />
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex justify-between items-center pt-2">
                      {/* 测试连通性状态提示 */}
                      <AnimatePresence mode="wait">
                        {testStatus !== 'idle' && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className={cn(
                              'flex items-center gap-2 text-sm',
                              testStatus === 'success' && 'text-green-600 dark:text-green-400',
                              testStatus === 'error' && 'text-red-600 dark:text-red-400',
                              testStatus === 'testing' && 'text-muted-foreground'
                            )}
                          >
                            {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
                            {testStatus === 'success' && <CheckCircle2 className="w-4 h-4" />}
                            {testStatus === 'error' && <XCircle className="w-4 h-4" />}
                            <span>{testMessage || '测试中...'}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2 ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={testConnection}
                          disabled={disabled || testStatus === 'testing' || (!localConfig.useDefault && !localConfig.apiKey)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {testStatus === 'testing' ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4 mr-2" />
                          )}
                          测试连通性
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReset}
                          disabled={disabled}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          重置为默认
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export { DEFAULT_CONFIG }
