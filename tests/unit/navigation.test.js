import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { navigationItems } from '../../src/data/navigation.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const appSource = readFileSync(resolve(repoRoot, 'src/App.vue'), 'utf8')
const siteHeaderSource = readFileSync(resolve(repoRoot, 'src/components/SiteHeader.vue'), 'utf8')
const baseCssSource = readFileSync(resolve(repoRoot, 'src/styles/base.css'), 'utf8')

test('shared navigation exposes the required href contract', () => {
  assert.deepEqual(
    navigationItems.map((item) => item.href),
    ['/', '/#experience', '/#projects', '/#skills', '/fitness/', '/study/', '/#contact']
  )
})

test('mobile route history controls are mounted globally for every route', () => {
  const controlsPath = resolve(repoRoot, 'src/components/MobileRouteControls.vue')

  assert.ok(existsSync(controlsPath))
  assert.match(appSource, /import MobileRouteControls/)
  assert.match(appSource, /<MobileRouteControls \/>/)
  assert.doesNotMatch(siteHeaderSource, /site-header__mobile-route/)
  assert.doesNotMatch(siteHeaderSource, /useRouter/)
  assert.doesNotMatch(baseCssSource, /\.site-header__mobile-route/)

  const controlsSource = readFileSync(controlsPath, 'utf8')

  assert.match(controlsSource, /useRouter/)
  assert.match(controlsSource, /aria-label="路由历史导航"/)
  assert.match(controlsSource, /aria-label="后退"/)
  assert.match(controlsSource, /aria-label="前进"/)
  assert.match(
    baseCssSource,
    /@media \(max-width: 980px\)[\s\S]*\.mobile-route-controls\s*{[\s\S]*display: inline-flex/
  )
})
