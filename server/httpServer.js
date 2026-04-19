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
  return String(baseUrl || '').trim().replace(/\/+$/, '')
}

function normalizePathname(pathname) {
  try {
    return decodeURIComponent(pathname || '/')
  } catch {
    return pathname || '/'
  }
}

export function resolveRequestTarget(rawPathname) {
  const pathname = normalizePathname(rawPathname)

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
    return { kind: 'invalid' }
  }

  if (STATIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return { kind: 'asset', relativePath: pathname.slice(1) }
  }

  // Project pages and project images share the /projects/ prefix.
  // Only treat /projects/* as a static asset when the request clearly targets a file.
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
    return res.end()
  }

  return createReadStream(filePath).pipe(res)
}

async function proxyApiRequest(req, res, proxyUrl, fetchImpl = fetch) {
  try {
    const upstreamResponse = await fetchImpl(proxyUrl, {
      method: req.method || 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    const contentType = upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8'
    res.statusCode = upstreamResponse.status
    res.setHeader('Content-Type', contentType)

    if ((req.method || 'GET') === 'HEAD') {
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
        return proxyApiRequest(req, res, executionMode.url, fetchImpl)
      }

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
        return sendJson(res, 400, { error: 'Invalid asset path.' })
      }
      return serveFile(res, assetPath, method)
    }

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
    throw new Error(`Missing built frontend output at ${indexPath}. Run "pnpm build" first.`)
  }

  return readFile(indexPath, 'utf8')
}
