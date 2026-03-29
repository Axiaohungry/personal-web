# Gemini Fitness Search Design

Date: 2026-03-29
Workspace: `personal-web`
Status: Approved in conversation and implemented inline

## Summary

Replace the food-library and supplement-library external search calls with Gemini-backed same-origin proxy endpoints so the frontend can keep a simple fetch flow without exposing the API key.

## Confirmed Decisions

- Use proxy endpoints instead of direct browser-to-Gemini requests
- Keep the project as a Vite + Vue 3 frontend
- Implement deployment in a Vercel-style `api/` serverless shape
- Keep food-library result rows in the shape:
  - `name`
  - `calories`
  - `carbs`
  - `protein`
  - `fat`
  - `scene`
- Keep supplement-library result rows in the shape:
  - `name`
  - `dose`
  - `bestFor`

## Architecture

- Frontend pages call same-origin routes:
  - `/api/fitness/food-search?q=...`
  - `/api/fitness/supplement-search?q=...`
- Server-side Gemini integration lives in `server/fitnessGemini.js`
- Vercel serverless handlers in `api/fitness/*.js` delegate to the shared server module
- Vite dev and preview use middleware in `vite.config.js` so local development can hit the same `/api` paths

## Request and Response Contracts

### Food Search

Request:

- `GET /api/fitness/food-search?q=<keyword>`

Response:

```json
{
  "items": [
    {
      "name": "香蕉 100g",
      "calories": 89,
      "carbs": 22.8,
      "protein": 1.1,
      "fat": 0.3,
      "scene": "训练前快速补碳"
    }
  ]
}
```

### Supplement Search

Request:

- `GET /api/fitness/supplement-search?q=<keyword>`

Response:

```json
{
  "items": [
    {
      "name": "肌酸一水合物",
      "dose": "3-5g / 天",
      "bestFor": "力量训练与增肌期"
    }
  ]
}
```

## Operational Notes

- `GEMINI_API_KEY` must stay server-side only
- `GEMINI_MODEL` is optional and defaults to `gemini-2.5-flash`
- Gemini is used as a fast lookup and formatting layer, not as a medical authority
- UI should clearly label AI-generated results as quick reference content

## Risks

- Gemini can hallucinate or over-generalize nutrition values
- Packaging-specific data may differ from generic food references
- Supplement dose advice can be oversimplified if used without context

## Mitigations

- Force JSON-only responses and normalize the output server-side
- Keep the results short, structured, and comparison-oriented
- Preserve official source cards in the UI for deeper reference
- Add explicit UI copy that AI output is for quick reference, not final authority

## Review Notes

- This workspace is not currently a Git repository, so no design-doc commit was created.
- Sub-agent review was not used in this session.
