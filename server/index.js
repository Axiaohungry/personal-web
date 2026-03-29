import { startHttpServer, verifyDistExists } from './httpServer.js'

await verifyDistExists()
startHttpServer()
