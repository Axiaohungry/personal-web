# Personal Fitness Workbench

一个基于 `Vite + Vue 3 + Vue Router` 的中文个人站点，包含：

- 公开个人主页
- 公开可用的健身工作台
- 细分模块中的食物库与补剂库

## Install

```bash
pnpm install
```

## Gemini Proxy Setup

不要把 Google AI Studio 的 key 写进前端代码。

1. 复制 `.env.example` 为 `.env.local`
2. 填入你轮换后的 key

```bash
GEMINI_API_KEY=your-rotated-key
GEMINI_MODEL=gemini-2.5-flash
```

## Local Run

```bash
pnpm dev
```

默认地址：

- `http://localhost:4173/`

本地开发和 `pnpm preview` 都会通过 Vite 中间件提供：

- `/api/fitness/food-search`
- `/api/fitness/supplement-search`

## Build

```bash
pnpm build
pnpm preview
```

## Test

```bash
pnpm test
```

也可以分别运行：

```bash
node tests/unit/entrypoints.test.js
node tests/unit/content-data.test.js
node tests/unit/navigation.test.js
node tests/unit/tdee.test.js
node tests/unit/macros.test.js
node tests/unit/storage.test.js
node tests/unit/theme.test.js
node tests/unit/module-plans.test.js
node tests/unit/fitness-gemini.test.js
```

## Deploy

当前仓库已经为 `Vercel 风格的 /api serverless` 准备了：

- `api/fitness/food-search.js`
- `api/fitness/supplement-search.js`
- `vercel.json` 中的 SPA rewrite

部署时只需要在平台环境变量中配置：

- `GEMINI_API_KEY`
- `GEMINI_MODEL`（可选）

## Security Note

你在对话里贴出的旧 `Google AI Studio API key` 已经算暴露了，建议立刻在 Google AI Studio 中废弃并重新生成一把新的 key，再只把新 key 放到 `.env.local` 和部署平台环境变量里。
