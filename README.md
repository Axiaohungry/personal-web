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

## ECS Deploy

这个仓库也已经支持通过 Docker 部署到 ECS。

最小流程：

```bash
docker build -t personal-web .
docker run -d --name personal-web --restart unless-stopped -p 80:3000 \
  -e FITNESS_API_UPSTREAM_BASE_URL=https://personal-web-blue-six.vercel.app \
  -e GEMINI_API_KEY=your-key \
  -e GEMINI_MODEL=gemini-2.5-flash \
  personal-web
```

如果你的 ECS 所在地域不能直接调用 Gemini API，可以只把页面部署在 ECS，上游接口继续复用 Vercel：

- `FITNESS_API_UPSTREAM_BASE_URL=https://你的-Vercel-生产域名`

配置后，ECS 上的 `/api/fitness/*` 会自动转发到这个上游地址，不再直接从 ECS 调用 Gemini。

健康检查：

```bash
curl http://127.0.0.1/healthz
```

## ECS Auto Deploy With GitHub Actions

仓库已经包含 ECS 自动部署工作流：

- `.github/workflows/deploy-ecs.yml`
- `scripts/ecs/deploy.sh`

推荐做法是给 ECS 安装一个 GitHub Actions self-hosted runner，并打上标签：

- `ecs-personal-web`

这样以后每次 `push origin main`，GitHub Actions 会直接在 ECS 上执行 Docker 重建和重启。

完整步骤见：

- `docs/ecs-github-actions.md`

## Security Note

你在对话里贴出的旧 `Google AI Studio API key` 已经算暴露了，建议立刻在 Google AI Studio 中废弃并重新生成一把新的 key，再只把新 key 放到 `.env.local` 和部署平台环境变量里。
