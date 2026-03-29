import http from 'node:http'
import { createReadStream, existsSync } from 'node:fs'
import { stat, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { handleNodeSearchRequest, sendJson } from './fitnessGemini.js'

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

  if (pathname.includes('..')) {
    return { kind: 'invalid' }
  }

  if (pathname.startsWith('/assets/')) {
    return { kind: 'asset', relativePath: pathname.slice(1) }
  }

  if (pathname === '/favicon.ico') {
    return { kind: 'asset', relativePath: 'favicon.ico' }
  }

  return { kind: 'spa' }
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

export function createHttpHandler(options = {}) {
  const distRoot = options.distRoot || DEFAULT_DIST_ROOT

  return async function httpHandler(req, res) {
    const method = req.method || 'GET'
    if (!['GET', 'HEAD'].includes(method)) {
      return sendJson(res, 405, { error: 'Method not allowed.' })
    }

    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const target = resolveRequestTarget(url.pathname)

    if (target.kind === 'invalid') {
      return sendJson(res, 400, { error: 'Invalid path.' })
    }

    if (target.kind === 'health') {
      return sendJson(res, 200, { ok: true })
    }

    if (target.kind === 'api') {
      return handleNodeSearchRequest(req, res, target.apiKind, options)
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
