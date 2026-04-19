import { handleNodeFitnessAssistantRequest } from '../../server/fitnessAssistantGemini.js'

export default async function handler(req, res) {
  return handleNodeFitnessAssistantRequest(req, res)
}
