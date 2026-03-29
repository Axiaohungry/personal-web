import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

import { handleNodeSearchRequest } from './server/fitnessGemini.js'

function createFitnessApiPlugin(options) {
  async function middleware(req, res, next) {
    const url = new URL(req.url || '/', 'http://127.0.0.1')

    if (url.pathname === '/api/fitness/food-search') {
      return handleNodeSearchRequest(req, res, 'food', options)
    }

    if (url.pathname === '/api/fitness/supplement-search') {
      return handleNodeSearchRequest(req, res, 'supplement', options)
    }

    return next()
  }

  return {
    name: 'fitness-gemini-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOptions = {
    apiKey: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL || process.env.GEMINI_MODEL,
  }

  return {
    plugins: [createFitnessApiPlugin(apiOptions), vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/ant-design-vue')) {
              return 'vendor-antd'
            }

            if (id.includes('node_modules/vue') || id.includes('node_modules/@vue')) {
              return 'vendor-vue'
            }
          },
        },
      },
    },
    server: {
      port: 4173,
    },
    preview: {
      port: 4173,
    },
  }
})
