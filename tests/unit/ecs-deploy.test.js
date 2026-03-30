import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('ecs deploy script health check uses the published host port', async () => {
  const script = await readFile(new URL('../../scripts/ecs/deploy.sh', import.meta.url), 'utf8')

  assert.match(
    script,
    /curl -fsS "http:\/\/127\.0\.0\.1:\$\{PORT\}\/healthz"/
  )
})
