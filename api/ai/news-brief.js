import { handleNodeAiNewsRequest } from '../../server/aiNewsGemini.js'

export default async function handler(req, res) {
  return handleNodeAiNewsRequest(req, res)
}
