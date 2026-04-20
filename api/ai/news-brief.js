import { handleNodeAiNewsRequest } from '../../server/aiNewsGemini.js'

export default async function handler(req, res) {
  // 首页 AI 动态在本地 Node 服务和云函数里复用同一个处理器，保证线上线下返回协议一致。
  return handleNodeAiNewsRequest(req, res)
}
