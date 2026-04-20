import { startHttpServer, verifyDistExists } from './httpServer.js'

// 本地生产预览入口：
// 先确认前端 dist 已经存在，再启动同一个 Node HTTP 服务来承接静态资源和 API。
await verifyDistExists()
startHttpServer()
