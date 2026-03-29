import { handleNodeSearchRequest } from '../../server/fitnessGemini.js'

export default async function handler(req, res) {
  return handleNodeSearchRequest(req, res, 'food')
}
