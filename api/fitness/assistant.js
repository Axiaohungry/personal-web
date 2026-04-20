import { handleNodeFitnessAssistantRequest } from '../../server/fitnessAssistantGemini.js'

export default async function handler(req, res) {
  // Serverless 层保持尽量薄，所有分类、边界判断和 Gemini 调用都下沉到 server 目录。
  return handleNodeFitnessAssistantRequest(req, res)
}
