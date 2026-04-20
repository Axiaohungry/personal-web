import { handleNodeSearchRequest } from '../../server/fitnessGemini.js'

export default async function handler(req, res) {
  // Vercel Serverless 入口只做转发，不重复实现搜索逻辑。
  return handleNodeSearchRequest(req, res, 'food')
}
