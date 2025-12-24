# Ink Battles

## 项目简介

Ink Battles 是一个 AI 写作作品分析平台。支持文本输入或图片上传，从多个维度对作品进行量化评分，并给出改进建议，帮助作者提升创作质量。

## 主要功能

- **多种输入方式**：支持直接粘贴文本、上传 TXT/DOCX 文件，或上传图片通过 Vision 模型识别内容
- **多维度评分**：从人物塑造力、结构复杂度、情节反转密度、情感穿透力、文体魅力、先锋性等维度进行 1-5 分打分
- **自定义模型**：支持配置自定义 AI 模型（OpenAI、Anthropic、DeepSeek 或任意兼容 OpenAI API 的服务）
- **连通性测试**：配置模型后可一键测试 API 连接是否正常
- **多种评分模式**：可选择初始门槛、产出编辑、内容特点、文本法官、热血刺激等评分角度
- **结构化分析**：生成 Mermaid 图表可视化作品结构
- **结果导出**：支持将分析结果导出为图片

## 环境变量

在根目录创建 `.env` 文件：

```bash
# OpenAI 兼容 API 配置
OPENAI_API_KEY=sk-xxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1

# 模型配置（可选）
MODEL=gpt-4o
TEMPERATURE=1.2
MAX_TOKENS=65536
```

> 用户也可以在界面上配置自己的模型，无需依赖服务端环境变量。

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
# 默认运行在 http://localhost:3090
```

### 生产构建

```bash
npm run build
npm run start
```

### Docker 部署

```bash
docker build -t ink-battles .
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e OPENAI_BASE_URL=https://api.openai.com/v1 \
  ink-battles
```

### Cloudflare Pages 部署

```bash
npm run deploy
```

## 技术栈

- Next.js 16
- React 19
- Tailwind CSS 4
- Framer Motion
- Radix UI
- xsai (AI SDK)

## 许可证

MIT License
