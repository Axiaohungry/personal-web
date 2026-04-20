import http from 'node:http'
import { createReadStream, existsSync } from 'node:fs'
import { stat, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { handleNodeSearchRequest, sendJson } from './fitnessGemini.js'
import { handleNodeAiNewsRequest } from './aiNewsGemini.js'
import { handleNodeFitnessAssistantRequest } from './fitnessAssistantGemini.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_DIST_ROOT = path.resolve(__dirname, '..', 'dist')

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const STATIC_ASSET_PREFIXES = ['/assets/', '/3dgs/']

function normalizeBaseUrl(baseUrl) {
  // 上游地址允许用户带尾部斜杠，这里先统一裁掉，避免后面拼出双斜杠 URL。
  return String(baseUrl || '').trim().replace(/\/+$/, '')
}

function normalizePathname(pathname) {
  try {
    // 先做 decodeURIComponent，是为了正确处理像 %2e%2e 这样的编码路径。
    return decodeURIComponent(pathname || '/')
  } catch {
    // 如果解码本身失败，就退回原始路径，让后续流程按“普通非法路径”处理。
    return pathname || '/'
  }
}

export function resolveRequestTarget(rawPathname) {
  const pathname = normalizePathname(rawPathname)

  // 这一步负责把所有请求先分流成几类：
  // 健康检查、API、本地静态资源、非法路径、以及最终回退给 SPA 的页面路由。
  // 后续 handler 只需要按 kind 分支处理，不必每次重新写一遍字符串判断。
  if (pathname === '/healthz') {
    return { kind: 'health' }
  }

  if (pathname === '/api/fitness/food-search') {
    return { kind: 'api', apiKind: 'food' }
  }

  if (pathname === '/api/fitness/supplement-search') {
    return { kind: 'api', apiKind: 'supplement' }
  }

  if (pathname === '/api/fitness/assistant') {
    return { kind: 'api', apiKind: 'fitness-assistant' }
  }

  if (pathname === '/api/ai/news-brief') {
    return { kind: 'api', apiKind: 'ai-news' }
  }

  if (pathname.includes('..')) {
    // 一旦出现路径穿越特征，直接判 invalid，不再继续尝试解析成静态资源。
    return { kind: 'invalid' }
  }

  if (STATIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return { kind: 'asset', relativePath: pathname.slice(1) }
  }

  // 项目详情页和项目图片都共用 /projects/ 前缀。
  // 只有当路径明确指向某个文件时，才把 /projects/* 识别成静态资源。
  if (pathname.startsWith('/projects/') && path.extname(pathname)) {
    return { kind: 'asset', relativePath: pathname.slice(1) }
  }

  if (pathname === '/favicon.ico') {
    return { kind: 'asset', relativePath: 'favicon.ico' }
  }

  return { kind: 'spa' }
}

export function buildUpstreamProxyUrl(baseUrl, requestUrl) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  if (!normalizedBaseUrl) return ''
  return `${normalizedBaseUrl}${requestUrl}`
}

export function resolveApiExecutionMode({ upstreamBaseUrl, apiKind, requestUrl }) {
  const proxyUrl = buildUpstreamProxyUrl(upstreamBaseUrl, requestUrl)

  // 如果配置了上游地址，就把请求代理给线上服务；
  // 否则直接走本地 Node 处理器，方便本地开发和部署环境共用一套入口。
  if (proxyUrl) {
    return {
      mode: 'proxy',
      url: proxyUrl,
    }
  }

  return {
    mode: 'local',
    apiKind,
  }
}

function getContentType(filePath) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
}

async function serveFile(res, filePath, method = 'GET') {
  try {
    // serveFile 的第一步不是直接读文件，而是先确认目标存在且确实是文件，不是目录。
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) {
      return sendJson(res, 404, { error: 'Not found.' })
    }
  } catch {
    return sendJson(res, 404, { error: 'Not found.' })
  }

  res.statusCode = 200
  res.setHeader('Content-Type', getContentType(filePath))

  if (method === 'HEAD') {
    // HEAD 只返回头，不返回内容体；这里提前结束，避免无意义地打开文件流。
    return res.end()
  }

  return createReadStream(filePath).pipe(res)
}

async function readProxyRequestBody(req) {
  // 在 Vercel / Node / 单元测试三种场景里，请求体的形态可能不同。
  // 这里统一把 body 读成字符串，避免代理层和本地 handler 各自维护一套读取逻辑。
  if (req && Object.prototype.hasOwnProperty.call(req, 'body')) {
    if (typeof req.body === 'string') {
      return req.body
    }

    if (Buffer.isBuffer(req.body)) {
      return req.body.toString('utf8')
    }

    if (req.body && typeof req.body === 'object') {
      return JSON.stringify(req.body)
    }

    return req.body == null ? '' : String(req.body)
  }

  if (typeof req?.on !== 'function') {
    return ''
  }

  const chunks = []
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    req.on('end', resolve)
    req.on('error', reject)
  })

  return Buffer.concat(chunks).toString('utf8')
}

async function proxyApiRequest(req, res, proxyUrl, fetchImpl = fetch) {
  try {
    const method = req.method || 'GET'
    const headers = { ...(req.headers || {}) }
    const hasContentType = Object.keys(headers).some(
      (name) => name.toLowerCase() === 'content-type'
    )

    if (method === 'POST' && !hasContentType) {
      // 某些测试或简化调用不会显式带 content-type。
      // 对 POST 请求默认补成 JSON，减少上游解析失败的概率。
      headers['content-type'] = 'application/json; charset=utf-8'
    }

    const requestInit = {
      method,
      headers,
    }

    if (method === 'POST') {
      requestInit.body = await readProxyRequestBody(req)
    }

    const upstreamResponse = await fetchImpl(proxyUrl, {
      ...requestInit,
    })

    const contentType = upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8'
    res.statusCode = upstreamResponse.status
    res.setHeader('Content-Type', contentType)

    if (method === 'HEAD') {
      // 代理模式下也保持与本地 serveFile 一样的 HEAD 语义。
      return res.end()
    }

    const responseText = await upstreamResponse.text()
    return res.end(responseText)
  } catch (error) {
    return sendJson(res, 502, {
      error: `Upstream proxy failed: ${error.message}`,
    })
  }
}

export function createHttpHandler(options = {}) {
  const distRoot = options.distRoot || DEFAULT_DIST_ROOT
  const upstreamBaseUrl =
    options.upstreamBaseUrl ||
    process.env.FITNESS_API_UPSTREAM_BASE_URL ||
    process.env.UPSTREAM_FITNESS_API_BASE_URL ||
    ''
  const fetchImpl = options.fetchImpl || fetch

  return async function httpHandler(req, res) {
    const method = req.method || 'GET'
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const target = resolveRequestTarget(url.pathname)

    if (target.kind === 'invalid') {
      return sendJson(res, 400, { error: 'Invalid path.' })
    }

    const allowFitnessAssistantPost =
      method === 'POST' && target.kind === 'api' && target.apiKind === 'fitness-assistant'

    // 这里只给训练助手开放 POST。
    // 其他 API 仍然只接受 GET/HEAD，避免误把搜索接口当成可写接口。
    if (!['GET', 'HEAD'].includes(method) && !allowFitnessAssistantPost) {
      return sendJson(res, 405, { error: 'Method not allowed.' })
    }

    if (target.kind === 'health') {
      return sendJson(res, 200, { ok: true })
    }

    if (target.kind === 'api') {
      const executionMode = resolveApiExecutionMode({
        upstreamBaseUrl,
        apiKind: target.apiKind,
        requestUrl: req.url || '',
      })

      if (executionMode.mode === 'proxy') {
        // 配了 upstream 时，本地只做网关，不再本地执行 AI 逻辑。
        return proxyApiRequest(req, res, executionMode.url, fetchImpl)
      }

      // 本地执行时再继续细分到各个 Gemini 能力处理器。
      // 这样代理与本地分支共享同一套路由判定，避免线上线下行为飘移。
      if (target.apiKind === 'ai-news') {
        return handleNodeAiNewsRequest(req, res, options)
      }

      if (target.apiKind === 'fitness-assistant') {
        return handleNodeFitnessAssistantRequest(req, res, options)
      }

      if (target.apiKind === 'food' || target.apiKind === 'supplement') {
        return handleNodeSearchRequest(req, res, target.apiKind, options)
      }

      return sendJson(res, 404, { error: 'Not found.' })

    }

    if (target.kind === 'asset') {
      const assetPath = path.resolve(distRoot, target.relativePath)
      if (!assetPath.startsWith(distRoot)) {
        // 双保险：就算前面分流通过了，这里仍再检查一次最终路径是否还在 dist 目录里。
        return sendJson(res, 400, { error: 'Invalid asset path.' })
      }
      return serveFile(res, assetPath, method)
    }

    // 其余合法路径全部回退到前端入口，让 Vue Router 自己接管页面级路由。
    const indexPath = path.resolve(distRoot, 'index.html')
    return serveFile(res, indexPath, method)
  }
}

export function startHttpServer(options = {}) {
  const port = Number(options.port || process.env.PORT || 3000)
  const host = options.host || process.env.HOST || '0.0.0.0'
  const handler = createHttpHandler(options)
  const server = http.createServer(handler)

  server.listen(port, host, () => {
    console.log(`Production server running at http://${host}:${port}`)
  })

  return server
}

export async function verifyDistExists(distRoot = DEFAULT_DIST_ROOT) {
  const indexPath = path.resolve(distRoot, 'index.html')
  if (!existsSync(indexPath)) {
    // 生产入口依赖 dist，所以缺包时直接抛错，比启动空服务更容易定位问题。
    throw new Error(`Missing built frontend output at ${indexPath}. Run "pnpm build" first.`)
  }

  return readFile(indexPath, 'utf8')
}
