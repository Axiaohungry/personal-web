import { handleNodeSearchRequest } from '../../server/fitnessGemini.js'

export default async function handler(req, res) {
  // 补剂搜索和食物搜索共用同一套服务端逻辑，只是 kind 不同。
  return handleNodeSearchRequest(req, res, 'supplement')
}
