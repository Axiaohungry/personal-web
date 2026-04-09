import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('ecs deploy script health check uses the published host port', async () => {
  const script = await readFile(new URL('../../scripts/ecs/deploy.sh', import.meta.url), 'utf8')

  assert.match(
    script,
    /curl -fsS "http:\/\/127\.0\.0\.1:\$\{PORT\}\/healthz"/
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
})

test('ecs workflow uses clean checkout on self-hosted runner', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/deploy-ecs.yml', import.meta.url), 'utf8')

  assert.doesNotMatch(workflow, /clean:\s*false/)
})
