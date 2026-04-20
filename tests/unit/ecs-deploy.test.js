import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('ecs deploy script health check uses the published host port', async () => {
  const script = await readFile(new URL('../../scripts/ecs/deploy.sh', import.meta.url), 'utf8')

  assert.match(
    script,
    /curl -fsS "http:\/\/127\.0\.0\.1:\$\{PORT\}\/healthz" >\/dev\/null/
  )
  assert.match(
    script,
    /ASSET_3DGS_DIR="\$\{ASSET_3DGS_DIR:-\/home\/ecs-assist-user\/personal-web\/public\/3dgs\}"/
  )
  assert.match(
    script,
    /Missing 3DGS asset manifest at \$\{ASSET_3DGS_DIR\}\/scene-metadata\.json/
  )
  assert.match(
    script,
    /cp -a "\$\{ASSET_3DGS_DIR\}" "\$\{BUILD_3DGS_DIR\}"/
  )
  assert.match(
    script,
    /for attempt in \$\(seq 1 "\$\{HEALTHCHECK_RETRIES\}"\); do/
  )
  assert.match(
    script,
    /if curl -fsS "http:\/\/127\.0\.0\.1:\$\{PORT\}\/healthz" >\/dev\/null; then/
  )
  assert.match(
    script,
    /docker logs "\$\{APP_NAME\}" --tail 200 \|\| true/
  )
})

test('ecs workflow uses clean checkout on self-hosted runner', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/deploy-ecs.yml', import.meta.url), 'utf8')

  assert.doesNotMatch(workflow, /clean:\s*false/)
})

test('ecs deploy script defines explicit proxy and local modes', async () => {
  const script = await readFile(new URL('../../scripts/ecs/deploy.sh', import.meta.url), 'utf8')

  assert.match(script, /MODE="\$\{MODE:-proxy\}"/)
  assert.match(script, /case "\$\{MODE\}" in/)
  assert.match(script, /proxy\)/)
  assert.match(script, /local\)/)
  assert.match(script, /MODE=proxy requires FITNESS_API_UPSTREAM_BASE_URL/)
  assert.match(script, /MODE=local requires GEMINI_API_KEY/)
  assert.match(script, /MODE must be proxy or local/)
})

test('ecs workflow passes deploy mode explicitly', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/deploy-ecs.yml', import.meta.url), 'utf8')

  assert.match(workflow, /MODE: \$\{\{ vars\.ECS_DEPLOY_MODE \|\| 'proxy' \}\}/)
})
