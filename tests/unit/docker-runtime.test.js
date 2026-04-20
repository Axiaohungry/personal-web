import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('runtime image copies server runtime data dependencies from src/data', async () => {
  const dockerfile = await readFile(new URL('../../Dockerfile', import.meta.url), 'utf8')

  assert.match(
    dockerfile,
    /COPY --from=build \/app\/src\/data\/fitnessModules\.js \.\/src\/data\/fitnessModules\.js/
  )
})
